import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth";
import { MAX_BLOB_CLIENT_UPLOAD_BYTES } from "@/lib/photoUploadLimits";
import { ALLOWED_IMAGE_MIME_LIST } from "@/lib/photoMime";

export async function POST(request: Request): Promise<NextResponse> {
  if (!process.env.BLOB_READ_WRITE_TOKEN?.trim()) {
    return NextResponse.json(
      { error: "未配置 BLOB_READ_WRITE_TOKEN" },
      { status: 503 }
    );
  }

  const body = (await request.json()) as HandleUploadBody;

  try {
    const jsonResponse = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (_pathname, _clientPayload) => {
        const admin = await isAdmin();
        if (!admin) {
          throw new Error("未授权，请先登录管理后台");
        }
        return {
          allowedContentTypes: ALLOWED_IMAGE_MIME_LIST,
          maximumSizeInBytes: MAX_BLOB_CLIENT_UPLOAD_BYTES,
          addRandomSuffix: false,
        };
      },
    });
    return NextResponse.json(jsonResponse);
  } catch (error) {
    const message = error instanceof Error ? error.message : "上传失败";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
