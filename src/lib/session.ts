/**
 * HMAC 签名 Cookie（Web Crypto，middleware 与 Route Handler 通用）。
 * 密钥优先 SESSION_SECRET，未配置时回退 ADMIN_PASSWORD；两者都没有则签名/校验一律失败。
 */

export const ADMIN_COOKIE = "admin_session";
export const VISITOR_COOKIE = "visitor_access";

export const ADMIN_MAX_AGE = 60 * 60 * 24 * 7; // 7 days
export const VISITOR_MAX_AGE = 60 * 60 * 24 * 365; // 1 year

const encoder = new TextEncoder();

function sessionSecret(): string {
  return (
    process.env.SESSION_SECRET?.trim() ||
    process.env.ADMIN_PASSWORD?.trim() ||
    ""
  );
}

async function hmacKey(usage: "sign" | "verify"): Promise<CryptoKey | null> {
  const secret = sessionSecret();
  if (!secret) return null;
  return crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    [usage]
  );
}

function toBase64Url(bytes: ArrayBuffer): string {
  let bin = "";
  for (const b of new Uint8Array(bytes)) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromBase64Url(s: string): Uint8Array<ArrayBuffer> | null {
  try {
    const bin = atob(s.replace(/-/g, "+").replace(/_/g, "/"));
    const out = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
    return out;
  } catch {
    return null;
  }
}

async function sign(payload: string): Promise<string> {
  const key = await hmacKey("sign");
  if (!key) throw new Error("SESSION_SECRET / ADMIN_PASSWORD 未配置，无法签发会话");
  const sig = await crypto.subtle.sign("HMAC", key, encoder.encode(payload));
  return `${payload}.${toBase64Url(sig)}`;
}

/** 校验签名，返回原始 payload；无效返回 null */
async function unsign(value: string | undefined): Promise<string | null> {
  if (!value) return null;
  const dot = value.lastIndexOf(".");
  if (dot <= 0) return null;
  const payload = value.slice(0, dot);
  const sig = fromBase64Url(value.slice(dot + 1));
  const key = await hmacKey("verify");
  if (!sig || !key) return null;
  const ok = await crypto.subtle.verify("HMAC", key, sig, encoder.encode(payload));
  return ok ? payload : null;
}

export function createAdminCookieValue(): Promise<string> {
  const expiresAt = Date.now() + ADMIN_MAX_AGE * 1000;
  return sign(`admin:${expiresAt}`);
}

export async function isValidAdminCookie(value: string | undefined): Promise<boolean> {
  const payload = await unsign(value);
  if (!payload?.startsWith("admin:")) return false;
  const expiresAt = Number(payload.slice("admin:".length));
  return Number.isFinite(expiresAt) && expiresAt > Date.now();
}

export function createVisitorCookieValue(accessToken: string): Promise<string> {
  return sign(`visitor:${accessToken}`);
}

/** 返回 Cookie 中签名有效的访问令牌（是否仍为 approved 需再查库） */
export async function visitorTokenFromCookie(
  value: string | undefined
): Promise<string | null> {
  const payload = await unsign(value);
  if (!payload?.startsWith("visitor:")) return null;
  return payload.slice("visitor:".length) || null;
}
