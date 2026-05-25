/** 经 API 表单上传（受 Vercel 函数请求体 ~4.5MB 限制） */
export const MAX_FORM_UPLOAD_BYTES = 4 * 1024 * 1024;

/** 浏览器直传 Blob（不经过函数请求体，可传高清大图） */
export const MAX_BLOB_CLIENT_UPLOAD_BYTES = 50 * 1024 * 1024;

export type PhotoUploadMode = "form" | "blob-client";

export type PhotoUploadConfig = {
  mode: PhotoUploadMode;
  maxBytes: number;
};

export function resolvePhotoUploadConfig(): PhotoUploadConfig {
  const useBlobClient = Boolean(process.env.BLOB_READ_WRITE_TOKEN?.trim());
  if (useBlobClient) {
    return { mode: "blob-client", maxBytes: MAX_BLOB_CLIENT_UPLOAD_BYTES };
  }
  return { mode: "form", maxBytes: MAX_FORM_UPLOAD_BYTES };
}
