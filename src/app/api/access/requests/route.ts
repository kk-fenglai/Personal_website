import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET() {
  const admin = await isAdmin();
  if (!admin) {
    return NextResponse.json({ error: "未授权" }, { status: 401 });
  }

  const list = await prisma.accessRequest.findMany({
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(list);
}
