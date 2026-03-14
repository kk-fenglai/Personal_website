import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { isAdmin } from "@/lib/auth";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await isAdmin();
  if (!admin) {
    return NextResponse.json({ error: "未授权" }, { status: 401 });
  }
  const { id } = await params;
  const body = await request.json();
  const { caption, isPublic } = body;
  const photo = await prisma.photo.update({
    where: { id },
    data: {
      ...(caption != null && { caption: caption.slice(0, 500) || null }),
      ...(typeof isPublic === "boolean" && { isPublic }),
    },
  });
  return NextResponse.json(photo);
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await isAdmin();
  if (!admin) {
    return NextResponse.json({ error: "未授权" }, { status: 401 });
  }
  const { id } = await params;
  await prisma.photo.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
