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
  return NextResponse.json(thought);
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
  const { title, content, isPublic } = body;
  const thought = await prisma.thought.update({
    where: { id },
    data: {
      ...(title != null && { title }),
      ...(content != null && { content }),
      ...(typeof isPublic === "boolean" && { isPublic }),
    },
  });
  return NextResponse.json(thought);
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
