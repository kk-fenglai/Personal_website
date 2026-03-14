import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { isAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";

const VISITOR_COOKIE = "visitor_access";

export async function GET() {
  const admin = await isAdmin();
  if (admin) {
    return NextResponse.json({ allowed: true, role: "admin" });
  }

  const cookieStore = await cookies();
  const token = cookieStore.get(VISITOR_COOKIE)?.value;
  if (!token) {
    return NextResponse.json({ allowed: false });
  }

  const record = await prisma.accessRequest.findFirst({
    where: { accessToken: token, status: "approved" },
  });
  if (!record) {
    return NextResponse.json({ allowed: false });
  }

  return NextResponse.json({ allowed: true, role: "visitor" });
}
