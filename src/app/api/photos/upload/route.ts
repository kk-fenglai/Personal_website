import { NextRequest, NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth";
import { MAX_FORM_UPLOAD_BYTES } from "@/lib/photoUploadLimits";
import { generateUploadFilename, resolveImageMime } from "@/lib/photoMime";
import { createPhotoRecord } from "@/lib/photoStorage";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

/** Vercel 上多图/大图上传需要更长执行时间 */
export const maxDuration = 60;

const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads");

export async function POST(request: NextRequest) {
  try {
    const admin = await isAdmin();
    if (!admin) {
      return NextResponse.json({ error: "未授权，请先登录管理后台" }, { status: 401 });
    }

    if (process.env.BLOB_READ_WRITE_TOKEN?.trim()) {
      return NextResponse.json(
        {
          error:
            "当前环境已启用 Blob 直传，请使用管理后台上传（自动走高清直传通道）。",
        },
        { status: 400 }
      );
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const caption = (formData.get("caption") as string) || "";
    const siteSlotRaw = (formData.get("siteSlot") as string) || "";
    const siteSlot = siteSlotRaw.trim() || null;
    const isPublic = siteSlot ? true : formData.get("isPublic") !== "false";

    if (!file || file.size === 0) {
      return NextResponse.json({ error: "请选择要上传的图片" }, { status: 400 });
    }

    if (file.size > MAX_FORM_UPLOAD_BYTES) {
      const mb = (MAX_FORM_UPLOAD_BYTES / (1024 * 1024)).toFixed(0);
      return NextResponse.json(
        {
          error: `单张图片不能超过 ${mb}MB。线上请配置 BLOB_READ_WRITE_TOKEN 以支持高清直传（最高 50MB）。`,
        },
        { status: 413 }
      );
    }

    const mime = resolveImageMime(file);
    if (!mime) {
      return NextResponse.json(
        {
          error:
            "不支持的格式。请使用 JPG、PNG、GIF、WebP；若为 iPhone 照片，可先转为 JPG 或在相册中「复制为静态图」后再上传。",
        },
        { status: 400 }
      );
    }

    const filename = generateUploadFilename(file.name);
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const onVercel = process.env.VERCEL === "1";
    let publicUrl: string;

    if (onVercel) {
      return NextResponse.json(
        {
          error:
            "当前为 Vercel 部署：请在项目 → Storage → Blob 添加 BLOB_READ_WRITE_TOKEN 后重新部署，以支持高清图片上传。",
        },
        { status: 503 }
      );
    }

    await mkdir(UPLOAD_DIR, { recursive: true });
    const filepath = path.join(UPLOAD_DIR, filename);
    await writeFile(filepath, buffer);
    publicUrl = `/uploads/${filename}`;

    const photo = await createPhotoRecord({
      filename: publicUrl,
      caption,
      isPublic,
      siteSlot,
    });
    return NextResponse.json(photo);
  } catch (e) {
    console.error("[photos/upload]", e);
    const msg = e instanceof Error ? e.message : "上传失败";
    return NextResponse.json(
      { error: msg.includes("ENOENT") || msg.includes("EACCES") ? "无法写入上传目录，请检查权限" : msg },
      { status: 500 }
    );
  }
}
