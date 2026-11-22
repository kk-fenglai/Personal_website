export function isAllowedPhotoUrl(url: string): boolean {
  if (url.startsWith("/uploads/")) return true;
  if (url.startsWith("https://") && url.includes(".blob.")) return true;
  return false;
}
