import path from "path";

export const ALLOWED_IMAGE_MIME = new Set([
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "image/heic",
  "image/heif",
  "image/avif",
]);

const SAFE_EXTENSIONS = [
  ".jpg",
  ".jpeg",
  ".png",
  ".gif",
  ".webp",
  ".heic",
  ".heif",
  ".avif",
] as const;

export function inferMimeFromName(name: string): string | null {
  const ext = path.extname(name).toLowerCase();
  const map: Record<string, string> = {
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".png": "image/png",
    ".gif": "image/gif",
    ".webp": "image/webp",
    ".heic": "image/heic",
    ".heif": "image/heif",
    ".avif": "image/avif",
  };
  return map[ext] ?? null;
}

export function resolveImageMime(file: { type?: string; name: string }): string | null {
  const t = file.type?.trim();
  if (t && ALLOWED_IMAGE_MIME.has(t)) return t;
  const inferred = inferMimeFromName(file.name);
  if (inferred && ALLOWED_IMAGE_MIME.has(inferred)) return inferred;
  return null;
}

export function generateUploadFilename(originalName: string): string {
  const ext = path.extname(originalName).toLowerCase() || ".jpg";
  const safeExt = (SAFE_EXTENSIONS as readonly string[]).includes(ext) ? ext : ".jpg";
  return `${Date.now()}-${performance.now().toString(36).replace(/\W/g, "")}-${Math.random().toString(36).slice(2)}${safeExt}`;
}

export const ALLOWED_IMAGE_MIME_LIST = [...ALLOWED_IMAGE_MIME];
