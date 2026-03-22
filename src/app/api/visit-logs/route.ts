import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { isAdmin } from "@/lib/auth";
import {
  lookupIpGeo,
  mergeGeo,
  parseVisitUserAgent,
} from "@/lib/visitLogEnrich";

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
  ip?: string;
  userAgent?: string;
  referer?: string;
  vercelCountry?: string;
  vercelRegion?: string;
};

/** 中间件调用：写入一条访问记录（含 UA 解析与 Geo） */
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

  const ip = body.ip?.slice(0, 128) || null;
  const uaStr = body.userAgent?.slice(0, 512) || null;
  const parsed = parseVisitUserAgent(uaStr);

  const geoRaw = ip ? await lookupIpGeo(ip) : { country: null, region: null, city: null };
  const geo = mergeGeo(
    geoRaw,
    body.vercelCountry?.trim() || null,
    body.vercelRegion?.trim() || null
  );

  await prisma.visitLog.create({
    data: {
      path,
      ip,
      userAgent: uaStr,
      referer: body.referer?.slice(0, 2048) || null,
      browser: parsed.browser?.slice(0, 128) || null,
      os: parsed.os?.slice(0, 128) || null,
      deviceType: parsed.deviceType?.slice(0, 64) || null,
      deviceModel: parsed.deviceModel?.slice(0, 128) || null,
      country: geo.country?.slice(0, 128) || null,
      region: geo.region?.slice(0, 128) || null,
      city: geo.city?.slice(0, 128) || null,
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
