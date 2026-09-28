import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { isAdmin, isApprovedVisitor } from "@/lib/auth";

/** 未获许可的访客只拿首页预览需要的几张 */
const HOME_PREVIEW_LIMIT = 5;

export async function GET() {
  const admin = await isAdmin();
  const viewer = admin || (await isApprovedVisitor());
  const photos = await prisma.photo.findMany({
    where: admin
      ? undefined
      : { isPublic: true, siteSlot: null },
    orderBy: { createdAt: "desc" },
    take: viewer ? undefined : HOME_PREVIEW_LIMIT,
  });
  return NextResponse.json(photos);
}
