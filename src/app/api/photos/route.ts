import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { isAdmin, isApprovedVisitor } from "@/lib/auth";
import { parsePage } from "@/lib/paging";

/** 未获许可的访客只拿首页预览需要的几张 */
const HOME_PREVIEW_LIMIT = 5;

export async function GET(request: NextRequest) {
  const admin = await isAdmin();
  const viewer = admin || (await isApprovedVisitor());
  // 关于页项目的配图走同一条上传通道，但不属于相册：对任何人都不列出
  const projectImages = (
    await prisma.project.findMany({
      where: { imageUrl: { not: null } },
      select: { imageUrl: true },
    })
  ).map((project) => project.imageUrl!);
  const where = {
    filename: { notIn: projectImages },
    ...(admin ? {} : { isPublic: true, siteSlot: null }),
  };
  const page = parsePage(request.nextUrl.searchParams);
  const skip = viewer ? (page?.skip ?? 0) : 0;
  const take = viewer ? page?.take : Math.min(page?.take ?? HOME_PREVIEW_LIMIT, HOME_PREVIEW_LIMIT);
  const [photos, total] = await Promise.all([
    prisma.photo.findMany({
      where,
      orderBy: [{ createdAt: "desc" }, { id: "asc" }],
      skip,
      take,
    }),
    page ? prisma.photo.count({ where }) : null,
  ]);
  if (!page || total === null) return NextResponse.json(photos);
  return NextResponse.json({
    items: photos,
    // 未获许可的访客不该知道相册一共有多少张
    total: viewer ? total : photos.length,
    hasMore: viewer && skip + photos.length < total,
  });
}
