import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { isAdmin } from "@/lib/auth";
import { translateAndSaveThought } from "@/lib/thoughtTranslateAndSave";

/** 管理员：手动重新生成英/法翻译（例如补密钥后、或 DeepL 曾失败） */
export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await isAdmin();
  if (!admin) {
    return NextResponse.json({ error: "未授权" }, { status: 401 });
  }
  const { id } = await params;
  const thought = await prisma.thought.findUnique({ where: { id } });
  if (!thought) {
    return NextResponse.json({ error: "未找到" }, { status: 404 });
  }
  await translateAndSaveThought(id, thought.title, thought.content);
  const fresh = await prisma.thought.findUnique({
    where: { id },
    include: { comments: { orderBy: { createdAt: "asc" } } },
  });
  return NextResponse.json(fresh);
}
