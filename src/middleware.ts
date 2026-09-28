import { NextRequest, NextResponse, type NextFetchEvent } from "next/server";
import {
  attachVisitorLikeCookie,
  getVisitorLikeKeyFromRequest,
} from "@/lib/visitorLikeKey";
import {
  ADMIN_COOKIE,
  VISITOR_COOKIE,
  isValidAdminCookie,
  visitorTokenFromCookie,
} from "@/lib/session";

/** 无需许可即可访问的页面：首页、申请访问页、管理后台（自带登录） */
function isOpenPage(path: string): boolean {
  if (path === "/") return true;
  return ["/verify", "/admin"].some((p) => path === p || path.startsWith(`${p}/`));
}

/** 签名校验（不查库）；撤销许可由各 API 查库兜底 */
async function hasSiteAccess(request: NextRequest): Promise<boolean> {
  if (await isValidAdminCookie(request.cookies.get(ADMIN_COOKIE)?.value)) {
    return true;
  }
  return !!(await visitorTokenFromCookie(request.cookies.get(VISITOR_COOKIE)?.value));
}

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
export async function middleware(request: NextRequest, event: NextFetchEvent) {
  const path = request.nextUrl.pathname;
  if (path.startsWith("/api")) {
    return NextResponse.next();
  }

  if (!isOpenPage(path) && !(await hasSiteAccess(request))) {
    const verifyUrl = new URL("/verify", request.url);
    verifyUrl.search = "";
    verifyUrl.searchParams.set("next", path + request.nextUrl.search);
    return NextResponse.redirect(verifyUrl);
  }

  if (request.method !== "GET") {
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
  const { key: visitorKey, isNew } = getVisitorLikeKeyFromRequest(request);
  const response = NextResponse.next();
  if (isNew) {
    attachVisitorLikeCookie(response, visitorKey, true);
  }

  if (!secret) {
    return response;
  }

  const logUrl = new URL("/api/visit-logs", request.url);
  const logPromise = fetch(logUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${secret}`,
    },
    body: JSON.stringify({ path, visitorKey }),
  }).catch((err) => {
    console.error("[visit-log middleware fetch]", err);
  });

  event.waitUntil(logPromise);

  return response;
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};
