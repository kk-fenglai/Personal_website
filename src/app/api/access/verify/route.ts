import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/db";
import {
  VISITOR_COOKIE,
  VISITOR_MAX_AGE,
  createVisitorCookieValue,
} from "@/lib/session";

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
  cookieStore.set(VISITOR_COOKIE, await createVisitorCookieValue(token), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: VISITOR_MAX_AGE,
    path: "/",
  });

  return NextResponse.json({ success: true });
}
