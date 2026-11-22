export function isAllowedPhotoUrl(url: string): boolean {
  if (url.startsWith("/uploads/")) return true;
  if (url.startsWith("https://") && url.includes(".blob.")) return true;
  return false;
}

const BLOB_HOST_SUFFIX = ".public.blob.vercel-storage.com";

/** 只有 next.config.ts 白名单里的 Blob 域名能交给图片缩放服务 */
export function canResizeRemoteImage(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.protocol === "https:" && parsed.hostname.endsWith(BLOB_HOST_SUFFIX);
  } catch {
    return false;
  }
}

/** width 必须是 next.config.ts 里 deviceSizes 或 imageSizes 中的一个值 */
export function resizedImageUrl(url: string, width: number): string {
  if (!canResizeRemoteImage(url)) return url;
  return `/_next/image?url=${encodeURIComponent(url)}&w=${width}&q=75`;
}
