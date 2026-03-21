import { NextRequest, NextResponse } from "next/server";

function visitLogSecret(): string {
  if (process.env.VISIT_LOG_SECRET?.trim()) {
    return process.env.VISIT_LOG_SECRET.trim();
  }
  if (process.env.NODE_ENV === "development") {
    return "dev-visit-log-insecure";
  }
  return "";
}

export function middleware(request: NextRequest) {
  if (request.method !== "GET") {
    return NextResponse.next();
  }

  const path = request.nextUrl.pathname;
  if (path.startsWith("/api")) {
    return NextResponse.next();
  }

  const accept = request.headers.get("accept") ?? "";
  if (!accept.includes("text/html")) {
    return NextResponse.next();
  }

  // 减少 RSC / 预取产生的重复记录
  if (request.headers.get("next-router-prefetch") === "1") {
    return NextResponse.next();
  }
  if (request.headers.get("Next-Router-Prefetch") === "1") {
    return NextResponse.next();
  }
  if (request.headers.get("RSC") === "1") {
    return NextResponse.next();
  }

  const secret = visitLogSecret();
  if (!secret) {
    return NextResponse.next();
  }

  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "";

  const payload = {
    path,
    ip,
    userAgent: request.headers.get("user-agent") ?? "",
    referer: request.headers.get("referer") ?? "",
  };

  const logUrl = new URL("/api/visit-logs", request.url);
  fetch(logUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${secret}`,
    },
    body: JSON.stringify(payload),
  }).catch(() => {});

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};
