import { NextRequest, NextResponse } from "next/server";
import { put } from "@vercel/blob";
import { prisma } from "@/lib/db";
import { isAdmin } from "@/lib/auth";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads");

const ALLOWED_MIME = new Set([
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "image/heic",
  "image/heif",
  "image/avif",
]);

/** 部分浏览器/系统不填 file.type，用扩展名推断 */
function inferMimeFromName(name: string): string | null {
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

function resolveImageMime(file: File): string | null {
  const t = file.type?.trim();
  if (t && ALLOWED_MIME.has(t)) return t;
  const inferred = inferMimeFromName(file.name);
  if (inferred && ALLOWED_MIME.has(inferred)) return inferred;
  return null;
}

export async function POST(request: NextRequest) {
  try {
    const admin = await isAdmin();
    if (!admin) {
      return NextResponse.json({ error: "未授权，请先登录管理后台" }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const caption = (formData.get("caption") as string) || "";
    const isPublic = formData.get("isPublic") !== "false";

    if (!file || file.size === 0) {
      return NextResponse.json({ error: "请选择要上传的图片" }, { status: 400 });
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

    const ext = path.extname(file.name).toLowerCase() || ".jpg";
    const safeExt = [".jpg", ".jpeg", ".png", ".gif", ".webp", ".heic", ".heif", ".avif"].includes(ext)
      ? ext
      : ".jpg";
    const filename = `${Date.now()}-${Math.random().toString(36).slice(2)}${safeExt}`;
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const useBlob = Boolean(process.env.BLOB_READ_WRITE_TOKEN);
    const onVercel = process.env.VERCEL === "1";

    let publicUrl: string;

    if (useBlob) {
      const blob = await put(`uploads/${filename}`, buffer, {
        access: "public",
        contentType: mime,
        addRandomSuffix: false,
      });
      publicUrl = blob.url;
    } else if (onVercel) {
      return NextResponse.json(
        {
          error:
            "当前为 Vercel 部署：无法在服务器本地写文件。请在 Vercel 项目 → Storage 创建 Blob，并添加环境变量 BLOB_READ_WRITE_TOKEN 后重新部署。",
        },
        { status: 503 }
      );
    } else {
      await mkdir(UPLOAD_DIR, { recursive: true });
      const filepath = path.join(UPLOAD_DIR, filename);
      await writeFile(filepath, buffer);
      publicUrl = `/uploads/${filename}`;
    }

    const photo = await prisma.photo.create({
      data: {
        filename: publicUrl,
        caption: caption.slice(0, 500) || null,
        isPublic,
      },
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
