/** Vercel 无服务器请求体上限约 4.5MB，预留余量 */
export const MAX_PHOTO_UPLOAD_BYTES = 4 * 1024 * 1024;

export type UploadPhotoOptions = {
  caption?: string;
  isPublic?: boolean;
  siteSlot?: string;
};

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

/**
 * 单张上传，带重试；多图请顺序调用并在两次之间间隔数百毫秒。
 */
export async function uploadPhotoWithRetry(
  file: File,
  options: UploadPhotoOptions = {},
  maxAttempts = 3
): Promise<
  | { ok: true; photo: Record<string, unknown> }
  | { ok: false; error: string; tooLarge?: boolean }
> {
  if (file.size > MAX_PHOTO_UPLOAD_BYTES) {
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

export function formatPhotoUploadBytes(bytes: number): string {
  if (bytes >= 1024 * 1024) {
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }
  return `${Math.round(bytes / 1024)} KB`;
}
