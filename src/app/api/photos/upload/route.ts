import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { isAdmin } from "@/lib/auth";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads");

export async function POST(request: NextRequest) {
  const admin = await isAdmin();
  if (!admin) {
    return NextResponse.json({ error: "未授权" }, { status: 401 });
  }
  const formData = await request.formData();
  const file = formData.get("file") as File | null;
  const caption = (formData.get("caption") as string) || "";
  const isPublic = formData.get("isPublic") !== "false";

  if (!file) {
    return NextResponse.json(
      { error: "请选择要上传的图片" },
      { status: 400 }
    );
  }

  const allowed = ["image/jpeg", "image/png", "image/gif", "image/webp"];
  if (!allowed.includes(file.type)) {
    return NextResponse.json(
      { error: "仅支持 JPG、PNG、GIF、WebP 格式" },
      { status: 400 }
    );
  }

  await mkdir(UPLOAD_DIR, { recursive: true });
  const ext = path.extname(file.name) || ".jpg";
  const filename = `${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`;
  const filepath = path.join(UPLOAD_DIR, filename);
  const bytes = await file.arrayBuffer();
  await writeFile(filepath, Buffer.from(bytes));

  const photo = await prisma.photo.create({
    data: {
      filename: `/uploads/${filename}`,
      caption: caption.slice(0, 500) || null,
      isPublic,
    },
  });
  return NextResponse.json(photo);
}
