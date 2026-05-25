import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { isAdmin } from "@/lib/auth";

export async function GET() {
  const items = await prisma.thoughtCategory.findMany({
    orderBy: { name: "asc" },
  });
  return NextResponse.json(items);
}

export async function POST(request: Request) {
  const admin = await isAdmin();
  if (!admin) {
    return NextResponse.json({ error: "未授权" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const name = String((body as { name?: unknown }).name ?? "").trim();
  if (!name) {
    return NextResponse.json({ error: "分类名称不能为空" }, { status: 400 });
  }
  if (name.length > 40) {
    return NextResponse.json({ error: "分类名称过长" }, { status: 400 });
  }

  try {
    const created = await prisma.thoughtCategory.create({ data: { name } });
    return NextResponse.json(created);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "";
    if (msg.toLowerCase().includes("unique") || msg.toLowerCase().includes("duplicate")) {
      return NextResponse.json({ error: "分类已存在" }, { status: 409 });
    }
    return NextResponse.json({ error: "创建失败" }, { status: 500 });
  }
}
