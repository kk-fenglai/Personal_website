import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { isAdmin } from "@/lib/auth";
import { isSiteSlot } from "@/lib/siteSlots";

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
  const { caption, isPublic, siteSlot } = body;

  if ("siteSlot" in body) {
    if (siteSlot !== null && !isSiteSlot(siteSlot)) {
      return NextResponse.json({ error: "无效的站点展示位" }, { status: 400 });
    }
    if (siteSlot) {
      await prisma.photo.updateMany({
        where: { siteSlot },
        data: { siteSlot: null },
      });
    }
    const photo = await prisma.photo.update({
      where: { id },
      data: {
        siteSlot: siteSlot ?? null,
        ...(siteSlot ? { isPublic: true } : {}),
        ...(caption != null && { caption: caption.slice(0, 500) || null }),
        ...(typeof isPublic === "boolean" && !siteSlot && { isPublic }),
      },
    });
    return NextResponse.json(photo);
  }

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
