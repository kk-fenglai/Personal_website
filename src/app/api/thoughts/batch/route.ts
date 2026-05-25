import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { isAdmin } from "@/lib/auth";

type BatchBody = {
  ids?: unknown;
  action?: unknown;
  categoryId?: unknown;
  isPinned?: unknown;
};

function parseIds(x: unknown): string[] {
  if (!Array.isArray(x)) return [];
  const ids = x.map((v) => String(v)).map((s) => s.trim()).filter(Boolean);
  return Array.from(new Set(ids));
}

export async function POST(request: Request) {
  const admin = await isAdmin();
  if (!admin) {
    return NextResponse.json({ error: "未授权" }, { status: 401 });
  }

  const body = (await request.json().catch(() => ({}))) as BatchBody;
  const ids = parseIds(body.ids);
  const action = String(body.action ?? "");

  if (ids.length === 0) {
    return NextResponse.json({ error: "缺少 ids" }, { status: 400 });
  }
  if (ids.length > 500) {
    return NextResponse.json({ error: "一次处理数量过多" }, { status: 400 });
  }

  if (action === "moveCategory") {
    const categoryId = String(body.categoryId ?? "");
    await prisma.thought.updateMany({
      where: { id: { in: ids } },
      data: { categoryId: categoryId ? categoryId : null },
    });
    return NextResponse.json({ success: true });
  }

  if (action === "pin") {
    const start = await prisma.thought.count({ where: { isPinned: true } });
    await prisma.$transaction(
      ids.map((id, idx) =>
        prisma.thought.update({
          where: { id },
          data: { isPinned: true, pinnedOrder: start + idx + 1 },
        })
      )
    );
    return NextResponse.json({ success: true });
  }

  if (action === "unpin") {
    await prisma.thought.updateMany({
      where: { id: { in: ids } },
      data: { isPinned: false, pinnedOrder: null },
    });
    return NextResponse.json({ success: true });
  }

  if (action === "delete") {
    await prisma.thought.deleteMany({ where: { id: { in: ids } } });
    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ error: "不支持的 action" }, { status: 400 });
}

