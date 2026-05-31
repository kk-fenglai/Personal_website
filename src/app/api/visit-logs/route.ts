import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { isAdmin } from "@/lib/auth";
import { isValidVisitorLikeKey } from "@/lib/visitorLikeKey";

function getVisitLogSecret(): string {
  if (process.env.VISIT_LOG_SECRET?.trim()) {
    return process.env.VISIT_LOG_SECRET.trim();
  }
  if (process.env.NODE_ENV === "development") {
    return "dev-visit-log-insecure";
  }
  return "";
}

type LogBody = {
  path?: string;
  visitorKey?: string;
};

/** 中间件调用：写入一条访问记录（匿名访客 + 路径） */
export async function POST(request: NextRequest) {
  const secret = getVisitLogSecret();
  if (!secret) {
    return NextResponse.json({ ok: false, error: "disabled" }, { status: 503 });
  }
  const auth = request.headers.get("authorization");
  if (auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "未授权" }, { status: 401 });
  }

  let body: LogBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "无效请求" }, { status: 400 });
  }

  const path = typeof body.path === "string" ? body.path.slice(0, 2048) : "";
  if (!path || !path.startsWith("/")) {
    return NextResponse.json({ error: "path 无效" }, { status: 400 });
  }

  const visitorKey =
    typeof body.visitorKey === "string" && isValidVisitorLikeKey(body.visitorKey)
      ? body.visitorKey
      : null;
  if (!visitorKey) {
    return NextResponse.json({ error: "visitorKey 无效" }, { status: 400 });
  }

  try {
    await prisma.visitLog.create({
      data: { path, visitorKey },
    });
  } catch (e) {
    console.error("[visit-log] prisma.create", e);
    return NextResponse.json(
      {
        error: "写入失败，请确认数据库已迁移（npx prisma db push）",
        detail: String(e),
      },
      { status: 500 }
    );
  }

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

  const [items, total, uniqueGroups] = await Promise.all([
    prisma.visitLog.findMany({
      orderBy: { createdAt: "desc" },
      take,
      skip,
    }),
    prisma.visitLog.count(),
    prisma.visitLog.groupBy({
      by: ["visitorKey"],
      where: { visitorKey: { not: null } },
    }),
  ]);

  return NextResponse.json({
    items,
    total,
    uniqueVisitors: uniqueGroups.length,
    take,
    skip,
  });
}
