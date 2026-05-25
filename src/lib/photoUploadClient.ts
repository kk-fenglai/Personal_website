import { upload } from "@vercel/blob/client";
import {
  MAX_FORM_UPLOAD_BYTES,
  type PhotoUploadConfig,
} from "@/lib/photoUploadLimits";
import { generateUploadFilename, resolveImageMime } from "@/lib/photoMime";

/** @deprecated 使用 getPhotoUploadConfig() 获取当前环境上限 */
export const MAX_PHOTO_UPLOAD_BYTES = MAX_FORM_UPLOAD_BYTES;

export type UploadPhotoOptions = {
  caption?: string;
  isPublic?: boolean;
  siteSlot?: string;
};

let cachedConfig: PhotoUploadConfig | null = null;

export function clearPhotoUploadConfigCache() {
  cachedConfig = null;
}

export async function getPhotoUploadConfig(): Promise<PhotoUploadConfig> {
  if (cachedConfig) return cachedConfig;
  try {
    const res = await fetch("/api/photos/upload/config", {
      credentials: "same-origin",
    });
    if (res.ok) {
      const data = (await res.json()) as PhotoUploadConfig;
      if (data.mode && typeof data.maxBytes === "number") {
        cachedConfig = data;
        return data;
      }
    }
  } catch {
    /* fallback */
  }
  cachedConfig = { mode: "form", maxBytes: MAX_FORM_UPLOAD_BYTES };
  return cachedConfig;
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function parseUploadResponse(res: Response): Promise<{
  ok: boolean;
  data: Record<string, unknown>;
}> {
  const text = await res.text();
  if (!text) return { ok: res.ok, data: {} };
  try {
    const data = JSON.parse(text) as Record<string, unknown>;
    return { ok: res.ok, data };
  } catch {
    return {
      ok: false,
      data: { error: res.ok ? "响应解析失败" : `HTTP ${res.status}` },
    };
  }
}

function shouldRetry(status: number): boolean {
  return status === 408 || status === 429 || status === 502 || status === 503 || status >= 500;
}

async function uploadViaBlobClient(
  file: File,
  options: UploadPhotoOptions,
  maxBytes: number,
  maxAttempts: number
): Promise<
  | { ok: true; photo: Record<string, unknown> }
  | { ok: false; error: string; tooLarge?: boolean }
> {
  if (file.size > maxBytes) {
    return { ok: false, error: file.name, tooLarge: true };
  }

  const mime = resolveImageMime(file);
  if (!mime) {
    return {
      ok: false,
      error:
        "不支持的格式。请使用 JPG、PNG、GIF、WebP；若为 iPhone 照片，可先转为 JPG 后再上传。",
    };
  }

  const pathname = `uploads/${generateUploadFilename(file.name)}`;
  const clientPayload = JSON.stringify({
    caption: options.caption ?? "",
    isPublic: options.isPublic ?? true,
    siteSlot: options.siteSlot ?? "",
  });

  let lastError = "网络错误";

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const blob = await upload(pathname, file, {
        access: "public",
        handleUploadUrl: "/api/photos/blob-upload",
        clientPayload,
      });

      const reg = await fetch("/api/photos/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({
          filename: blob.url,
          caption: options.caption ?? "",
          isPublic: options.isPublic ?? true,
          siteSlot: options.siteSlot ?? "",
        }),
      });

      const { ok, data } = await parseUploadResponse(reg);
      if (ok) {
        return { ok: true, photo: data };
      }

      lastError =
        typeof data.error === "string" ? data.error : `HTTP ${reg.status}`;
      if (!shouldRetry(reg.status) || attempt === maxAttempts) {
        return { ok: false, error: lastError };
      }
    } catch (e) {
      lastError = e instanceof Error ? e.message : "网络错误";
      if (attempt === maxAttempts) {
        return { ok: false, error: lastError };
      }
    }

    await sleep(800 * attempt);
  }

  return { ok: false, error: lastError };
}

async function uploadViaForm(
  file: File,
  options: UploadPhotoOptions,
  maxBytes: number,
  maxAttempts: number
): Promise<
  | { ok: true; photo: Record<string, unknown> }
  | { ok: false; error: string; tooLarge?: boolean }
> {
  if (file.size > maxBytes) {
    return { ok: false, error: file.name, tooLarge: true };
  }

  let lastError = "网络错误";

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const form = new FormData();
      form.append("file", file);
      if (options.caption != null) form.append("caption", options.caption);
      if (options.isPublic != null) {
        form.append("isPublic", String(options.isPublic));
      }
      if (options.siteSlot) form.append("siteSlot", options.siteSlot);

      const res = await fetch("/api/photos/upload", {
        method: "POST",
        body: form,
        credentials: "same-origin",
      });

      const { ok, data } = await parseUploadResponse(res);
      if (ok) {
        return { ok: true, photo: data };
      }

      lastError =
        typeof data.error === "string" ? data.error : `HTTP ${res.status}`;
      if (!shouldRetry(res.status) || attempt === maxAttempts) {
        return { ok: false, error: lastError };
      }
    } catch (e) {
      lastError = e instanceof Error ? e.message : "网络错误";
      if (attempt === maxAttempts) {
        return { ok: false, error: lastError };
      }
    }

    await sleep(800 * attempt);
  }

  return { ok: false, error: lastError };
}

/**
 * 单张上传，带重试。线上配置 Blob 时浏览器直传，最高约 50MB；本地无 Blob 时走表单（约 4MB）。
 */
export async function uploadPhotoWithRetry(
  file: File,
  options: UploadPhotoOptions = {},
  maxAttempts = 3
): Promise<
  | { ok: true; photo: Record<string, unknown> }
  | { ok: false; error: string; tooLarge?: boolean }
> {
  const config = await getPhotoUploadConfig();
  if (config.mode === "blob-client") {
    return uploadViaBlobClient(file, options, config.maxBytes, maxAttempts);
  }
  return uploadViaForm(file, options, config.maxBytes, maxAttempts);
}

export function formatPhotoUploadBytes(bytes: number): string {
  if (bytes >= 1024 * 1024) {
    return `${(bytes / (1024 * 1024)).toFixed(0)} MB`;
  }
  return `${Math.round(bytes / 1024)} KB`;
}
