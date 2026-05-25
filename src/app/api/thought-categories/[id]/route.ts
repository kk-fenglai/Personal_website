import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { isAdmin } from "@/lib/auth";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await isAdmin();
  if (!admin) {
    return NextResponse.json({ error: "未授权" }, { status: 401 });
  }

  const { id } = await params;
  const body = await request.json().catch(() => ({}));
  const name = String((body as { name?: unknown }).name ?? "").trim();
  if (!name) {
    return NextResponse.json({ error: "分类名称不能为空" }, { status: 400 });
  }
  if (name.length > 40) {
    return NextResponse.json({ error: "分类名称过长" }, { status: 400 });
  }

  try {
    const updated = await prisma.thoughtCategory.update({
      where: { id },
      data: { name },
    });
    return NextResponse.json(updated);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "";
    if (msg.toLowerCase().includes("unique") || msg.toLowerCase().includes("duplicate")) {
      return NextResponse.json({ error: "分类已存在" }, { status: 409 });
    }
    return NextResponse.json({ error: "更新失败" }, { status: 500 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await isAdmin();
  if (!admin) {
    return NextResponse.json({ error: "未授权" }, { status: 401 });
  }

  const { id } = await params;
  await prisma.$transaction([
    prisma.thought.updateMany({ where: { categoryId: id }, data: { categoryId: null } }),
    prisma.thoughtCategory.delete({ where: { id } }),
  ]);
  return NextResponse.json({ success: true });
}

