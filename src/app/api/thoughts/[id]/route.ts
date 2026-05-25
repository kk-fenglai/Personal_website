import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { isAdmin } from "@/lib/auth";
import { translateAndSaveThought } from "@/lib/thoughtTranslateAndSave";
import { getLikeStatsForOne } from "@/lib/likes";
import { getVisitorLikeKeyFromRequest } from "@/lib/visitorLikeKey";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const admin = await isAdmin();
  const thought = await prisma.thought.findUnique({
    where: { id },
    include: { category: true, comments: { orderBy: { createdAt: "asc" } } },
  });
  if (!thought) {
    return NextResponse.json({ error: "未找到" }, { status: 404 });
  }
  if (!thought.isPublic && !admin) {
    return NextResponse.json({ error: "未授权" }, { status: 403 });
  }
  const { key: visitorKey } = getVisitorLikeKeyFromRequest(_request);
  let likeCount = 0;
  let likedByVisitor = false;
  try {
    const likeStats = await getLikeStatsForOne("thought", id, visitorKey);
    likeCount = likeStats.count;
    likedByVisitor = likeStats.liked;
  } catch (e) {
    console.error("[thoughts GET id] like stats skipped:", e);
  }
  return NextResponse.json({
    ...thought,
    likeCount,
    likedByVisitor,
  });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await isAdmin();
  if (!admin) {
    return NextResponse.json({ error: "未授权" }, { status: 401 });
  }
  const { id } = await params;
  const body = await request.json();
  const { title, content, isPublic, categoryId, isPinned, pinnedOrder } = body;
  const thought = await prisma.thought.update({
    where: { id },
    data: {
      ...(title != null && { title }),
      ...(content != null && { content }),
      ...(typeof isPublic === "boolean" && { isPublic }),
      ...(categoryId !== undefined && { categoryId: categoryId || null }),
      ...(typeof isPinned === "boolean" && {
        isPinned,
        pinnedOrder: isPinned ? (typeof pinnedOrder === "number" ? pinnedOrder : 0) : null,
      }),
      ...(typeof pinnedOrder === "number" && { pinnedOrder }),
    },
  });
  if (title != null || content != null) {
    await translateAndSaveThought(id, thought.title, thought.content);
  }
  const fresh = await prisma.thought.findUnique({
    where: { id },
    include: { category: true, comments: { orderBy: { createdAt: "asc" } } },
  });
  return NextResponse.json(fresh ?? thought);
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await isAdmin();
  if (!admin) {
    return NextResponse.json({ error: "未授权" }, { status: 401 });
  }
  const { id } = await params;
  await prisma.thought.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
