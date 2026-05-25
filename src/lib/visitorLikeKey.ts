import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

export const VISITOR_LIKE_COOKIE = "visitor_like_key";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

const KEY_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function createVisitorLikeKey(): string {
  return crypto.randomUUID();
}

export function isValidVisitorLikeKey(key: string | undefined): key is string {
  return !!key && KEY_RE.test(key);
}

/** Server Components / Route Handlers without Request */
export async function getVisitorLikeKeyFromCookies(): Promise<string | null> {
  const jar = await cookies();
  const value = jar.get(VISITOR_LIKE_COOKIE)?.value;
  return isValidVisitorLikeKey(value) ? value : null;
}

export function getVisitorLikeKeyFromRequest(
  request: NextRequest
): { key: string; isNew: boolean } {
  const existing = request.cookies.get(VISITOR_LIKE_COOKIE)?.value;
  if (isValidVisitorLikeKey(existing)) {
    return { key: existing, isNew: false };
  }
  return { key: createVisitorLikeKey(), isNew: true };
}

export function attachVisitorLikeCookie(
  response: NextResponse,
  key: string,
  isNew: boolean
): NextResponse {
  if (!isNew) return response;
  response.cookies.set(VISITOR_LIKE_COOKIE, key, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: COOKIE_MAX_AGE,
  });
  return response;
}
