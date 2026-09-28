import { cookies } from "next/headers";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import {
  ADMIN_COOKIE,
  ADMIN_MAX_AGE,
  VISITOR_COOKIE,
  createAdminCookieValue,
  isValidAdminCookie,
  visitorTokenFromCookie,
} from "@/lib/session";

export async function setAdminSession() {
  const cookieStore = await cookies();
  cookieStore.set(ADMIN_COOKIE, await createAdminCookieValue(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: ADMIN_MAX_AGE,
    path: "/",
  });
}

export async function clearAdminSession() {
  const cookieStore = await cookies();
  cookieStore.delete(ADMIN_COOKIE);
}

export async function isAdmin(): Promise<boolean> {
  const cookieStore = await cookies();
  return isValidAdminCookie(cookieStore.get(ADMIN_COOKIE)?.value);
}

/** 已获批准的访客（签名有效且申请仍为 approved） */
export async function isApprovedVisitor(): Promise<boolean> {
  const cookieStore = await cookies();
  const token = await visitorTokenFromCookie(cookieStore.get(VISITOR_COOKIE)?.value);
  if (!token) return false;
  const record = await prisma.accessRequest.findFirst({
    where: { accessToken: token, status: "approved" },
    select: { id: true },
  });
  return !!record;
}

/** 可查看首页以外内容：管理员或已获批准的访客 */
export async function canViewSite(): Promise<boolean> {
  return (await isAdmin()) || (await isApprovedVisitor());
}

export async function verifyAdminPassword(
  username: string,
  password: string
): Promise<boolean> {
  const adminPassword = process.env.ADMIN_PASSWORD;
  const adminUsername = process.env.ADMIN_USERNAME ?? "admin";
  if (!adminPassword) return false;
  if (username !== adminUsername) return false;
  // Support both plain text (dev) and bcrypt hash
  if (adminPassword.startsWith("$2")) {
    return bcrypt.compare(password, adminPassword);
  }
  return password === adminPassword;
}
