import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { isAdmin } from "@/lib/auth";

function getVisitLogSecret(): string {
  if (process.env.VISIT_LOG_SECRET?.trim()) {
    return process.env.VISIT_LOG_SECRET.trim();
  }
  if (process.env.NODE_ENV === "development") {
    return "dev-visit-log-insecure";
  }
  return "";
}

/** 中间件调用：写入一条访问记录 */
export async function POST(request: NextRequest) {
  const secret = getVisitLogSecret();
  if (!secret) {
    return NextResponse.json({ ok: false, error: "disabled" }, { status: 503 });
  }
  const auth = request.headers.get("authorization");
  if (auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "未授权" }, { status: 401 });
  }

  let body: { path?: string; ip?: string; userAgent?: string; referer?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "无效请求" }, { status: 400 });
  }

  const path = typeof body.path === "string" ? body.path.slice(0, 2048) : "";
  if (!path || !path.startsWith("/")) {
    return NextResponse.json({ error: "path 无效" }, { status: 400 });
  }

  await prisma.visitLog.create({
    data: {
      path,
      ip: body.ip?.slice(0, 128) || null,
      userAgent: body.userAgent?.slice(0, 512) || null,
      referer: body.referer?.slice(0, 2048) || null,
    },
  });

  return NextResponse.json({ ok: true });
}

/** 管理员：分页查询访问记录（新在前） */
export async function GET(request: NextRequest) {
  const admin = await isAdmin();
  if (!admin) {
    return NextResponse.json({ error: "未授权" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const take = Math.min(Number(searchParams.get("take")) || 100, 500);
  const skip = Math.max(Number(searchParams.get("skip")) || 0, 0);

  const [items, total] = await Promise.all([
    prisma.visitLog.findMany({
      orderBy: { createdAt: "desc" },
      take,
      skip,
    }),
    prisma.visitLog.count(),
  ]);

  return NextResponse.json({ items, total, take, skip });
}
