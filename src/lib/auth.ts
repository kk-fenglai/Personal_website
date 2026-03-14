import { cookies } from "next/headers";
import bcrypt from "bcryptjs";

const ADMIN_COOKIE = "admin_session";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 7; // 7 days

export async function setAdminSession() {
  const cookieStore = await cookies();
  cookieStore.set(ADMIN_COOKIE, "1", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: COOKIE_MAX_AGE,
    path: "/",
  });
}

export async function clearAdminSession() {
  const cookieStore = await cookies();
  cookieStore.delete(ADMIN_COOKIE);
}

export async function isAdmin(): Promise<boolean> {
  const cookieStore = await cookies();
  const session = cookieStore.get(ADMIN_COOKIE);
  return session?.value === "1";
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
