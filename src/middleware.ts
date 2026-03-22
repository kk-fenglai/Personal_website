import { NextRequest, NextResponse, type NextFetchEvent } from "next/server";

function visitLogSecret(): string {
  if (process.env.VISIT_LOG_SECRET?.trim()) {
    return process.env.VISIT_LOG_SECRET.trim();
  }
  if (process.env.NODE_ENV === "development") {
    return "dev-visit-log-insecure";
  }
  return "";
}

/**
 * 使用 waitUntil，避免 Vercel Edge 在 return next() 后终止未完成的 fetch，导致访问记录写不进库。
 */
export function middleware(request: NextRequest, event: NextFetchEvent) {
  if (request.method !== "GET") {
    return NextResponse.next();
  }

  const path = request.nextUrl.pathname;
  if (path.startsWith("/api")) {
    return NextResponse.next();
  }

  const accept = request.headers.get("accept") ?? "";
  const secFetchMode = request.headers.get("sec-fetch-mode");
  const secFetchDest = request.headers.get("sec-fetch-dest");
  const looksLikePageNavigation =
    accept.includes("text/html") ||
    secFetchMode === "navigate" ||
    secFetchDest === "document";
  if (!looksLikePageNavigation) {
    return NextResponse.next();
  }

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
    vercelCountry: request.headers.get("x-vercel-ip-country") ?? "",
    vercelRegion: request.headers.get("x-vercel-ip-country-region") ?? "",
  };

  const logUrl = new URL("/api/visit-logs", request.url);
  const logPromise = fetch(logUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${secret}`,
    },
    body: JSON.stringify(payload),
  }).catch((err) => {
    console.error("[visit-log middleware fetch]", err);
  });

  event.waitUntil(logPromise);

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};
