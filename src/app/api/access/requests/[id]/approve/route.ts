import { NextRequest, NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { randomBytes } from "crypto";

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await isAdmin();
  if (!admin) {
    return NextResponse.json({ error: "未授权" }, { status: 401 });
  }

  const { id } = await params;
  const token = randomBytes(16).toString("hex");

  const updated = await prisma.accessRequest.update({
    where: { id },
    data: { status: "approved", accessToken: token },
  });

  return NextResponse.json({ success: true, token, name: updated.name });
}
