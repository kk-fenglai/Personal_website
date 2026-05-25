import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { isAdmin } from "@/lib/auth";

const MAX_HOME_FEATURED = 3;

export async function GET() {
  const featured = await prisma.thought.findMany({
    where: {
      homeFeaturedOrder: { not: null },
      isPublic: true,
    },
    orderBy: { homeFeaturedOrder: "asc" },
    take: MAX_HOME_FEATURED,
  });

  if (featured.length > 0) {
    return NextResponse.json(featured);
  }

  const fallback = await prisma.thought.findMany({
    where: { isPublic: true },
    orderBy: { createdAt: "desc" },
    take: MAX_HOME_FEATURED,
  });
  return NextResponse.json(fallback);
}

function parseSlots(body: { slots?: unknown; ids?: unknown }): (string | null)[] {
  if (Array.isArray(body.slots)) {
    const out: (string | null)[] = [];
    for (let i = 0; i < MAX_HOME_FEATURED; i++) {
      const v = body.slots[i];
      const id = typeof v === "string" ? v.trim() : "";
      out.push(id || null);
    }
    return out;
  }
  const raw = Array.isArray(body.ids) ? body.ids : [];
  const ids = raw.map((x) => String(x).trim()).filter((s) => s.length > 0);
  return [
    ids[0] ?? null,
    ids[1] ?? null,
    ids[2] ?? null,
  ];
}

export async function POST(request: NextRequest) {
  const admin = await isAdmin();
  if (!admin) {
    return NextResponse.json({ error: "未授权，请先登录管理后台" }, { status: 401 });
  }

  try {
    const body = (await request.json().catch(() => ({}))) as {
      slots?: unknown;
      ids?: unknown;
    };
    const slots = parseSlots(body);
    const chosen = slots.filter((id): id is string => Boolean(id));

    if (new Set(chosen).size !== chosen.length) {
      return NextResponse.json(
        { error: "同一篇随想不能出现在多个位置，请分别选择不同的文章" },
        { status: 400 }
      );
    }

    if (chosen.length > 0) {
      const found = await prisma.thought.count({
        where: { id: { in: chosen } },
      });
      if (found !== chosen.length) {
        return NextResponse.json(
          { error: "所选随想不存在或已被删除，请刷新后重试" },
          { status: 400 }
        );
      }
    }

    await prisma.thought.updateMany({
      where: { homeFeaturedOrder: { not: null } },
      data: { homeFeaturedOrder: null },
    });

    for (let i = 0; i < slots.length; i++) {
      const id = slots[i];
      if (!id) continue;
      await prisma.thought.update({
        where: { id },
        data: { homeFeaturedOrder: i + 1 },
      });
    }

    const featured = await prisma.thought.findMany({
      where: { homeFeaturedOrder: { not: null } },
      orderBy: { homeFeaturedOrder: "asc" },
      include: { category: true },
    });

    return NextResponse.json({ success: true, featured });
  } catch (e) {
    console.error("[thoughts/home-featured POST]", e);
    const msg = e instanceof Error ? e.message : "保存失败";
    if (msg.includes("Unknown argument `homeFeaturedOrder`")) {
      return NextResponse.json(
        {
          error:
            "服务使用了过期的数据库客户端，请重启开发服务器（停止 npm run dev 后重新运行）",
        },
        { status: 500 }
      );
    }
    const schemaHint =
      msg.includes("homeFeaturedOrder") || msg.includes("column")
        ? "数据库可能未更新，请在服务器执行 npm run db:push 后重启服务"
        : msg;
    return NextResponse.json({ error: schemaHint }, { status: 500 });
  }
}
