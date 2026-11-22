import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { isAdmin, isApprovedVisitor } from "@/lib/auth";

/** 未获许可的访客只拿首页预览需要的几张 */
const HOME_PREVIEW_LIMIT = 5;

export async function GET() {
  const admin = await isAdmin();
  const viewer = admin || (await isApprovedVisitor());
  // 关于页项目的配图走同一条上传通道，但不属于相册：对任何人都不列出
  const projectImages = (
    await prisma.project.findMany({
      where: { imageUrl: { not: null } },
      select: { imageUrl: true },
    })
  ).map((project) => project.imageUrl!);
  const photos = await prisma.photo.findMany({
    where: {
      filename: { notIn: projectImages },
      ...(admin ? {} : { isPublic: true, siteSlot: null }),
    },
    orderBy: { createdAt: "desc" },
    take: viewer ? undefined : HOME_PREVIEW_LIMIT,
  });
  return NextResponse.json(photos);
}
