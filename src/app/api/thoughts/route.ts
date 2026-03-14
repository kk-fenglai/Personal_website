import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { isAdmin } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const admin = await isAdmin();
  const thoughts = await prisma.thought.findMany({
    where: admin ? undefined : { isPublic: true },
    orderBy: { createdAt: "desc" },
    include: { comments: { orderBy: { createdAt: "asc" } } },
  });
  return NextResponse.json(thoughts);
}

export async function POST(request: NextRequest) {
  const admin = await isAdmin();
  if (!admin) {
    return NextResponse.json({ error: "未授权" }, { status: 401 });
  }
  const body = await request.json();
  const { title, content, isPublic = true } = body;
  if (!title || !content) {
    return NextResponse.json(
      { error: "标题和内容不能为空" },
      { status: 400 }
    );
  }
  const thought = await prisma.thought.create({
    data: { title, content, isPublic: !!isPublic },
  });
  return NextResponse.json(thought);
}
