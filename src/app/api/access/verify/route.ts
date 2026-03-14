import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/db";

const VISITOR_COOKIE = "visitor_access";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 365; // 1 year

export async function POST(request: NextRequest) {
  const body = await request.json();
  const token = String(body.token || "").trim();
  if (!token) {
    return NextResponse.json({ error: "请填写验证码" }, { status: 400 });
  }

  const record = await prisma.accessRequest.findFirst({
    where: { accessToken: token, status: "approved" },
  });
  if (!record) {
    return NextResponse.json({ error: "验证码无效或未通过审核" }, { status: 400 });
  }

  const cookieStore = await cookies();
  cookieStore.set(VISITOR_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: COOKIE_MAX_AGE,
    path: "/",
  });

  return NextResponse.json({ success: true });
}
