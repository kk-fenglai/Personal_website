import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { isAdmin } from "@/lib/auth";

type Body = { ids?: unknown } | unknown;

function parseIds(body: Body): string[] {
  const raw = Array.isArray(body) ? body : (body as { ids?: unknown } | null)?.ids;
  if (!Array.isArray(raw)) return [];
  const ids = raw.map((x) => String(x)).map((s) => s.trim()).filter(Boolean);
  // de-dupe while preserving order
  return Array.from(new Set(ids));
}

export async function POST(request: Request) {
  const admin = await isAdmin();
  if (!admin) {
    return NextResponse.json({ error: "未授权" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const ids = parseIds(body);
  if (ids.length === 0) {
    return NextResponse.json({ error: "缺少 ids" }, { status: 400 });
  }
  if (ids.length > 200) {
    return NextResponse.json({ error: "置顶数量过多" }, { status: 400 });
  }

  await prisma.$transaction(
    ids.map((id, idx) =>
      prisma.thought.update({
        where: { id },
        data: { isPinned: true, pinnedOrder: idx + 1 },
      })
    )
  );

  return NextResponse.json({ success: true });
}

