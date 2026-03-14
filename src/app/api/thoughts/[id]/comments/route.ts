import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { isAdmin } from "@/lib/auth";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const admin = await isAdmin();
  const thought = await prisma.thought.findUnique({
    where: { id },
    include: { comments: { orderBy: { createdAt: "asc" } } },
  });
  if (!thought) {
    return NextResponse.json({ error: "未找到" }, { status: 404 });
  }
  if (!thought.isPublic && !admin) {
    return NextResponse.json({ error: "未授权" }, { status: 403 });
  }
  return NextResponse.json(thought.comments);
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const thought = await prisma.thought.findUnique({ where: { id } });
  if (!thought) {
    return NextResponse.json({ error: "未找到" }, { status: 404 });
  }
  if (!thought.isPublic) {
    return NextResponse.json({ error: "该内容未公开" }, { status: 403 });
  }
  const body = await request.json();
  const { author, content } = body;
  if (!author?.trim() || !content?.trim()) {
    return NextResponse.json(
      { error: "昵称和评论内容不能为空" },
      { status: 400 }
    );
  }
  const comment = await prisma.comment.create({
    data: {
      thoughtId: id,
      author: author.trim().slice(0, 64),
      content: content.trim().slice(0, 2000),
    },
  });
  return NextResponse.json(comment);
}
