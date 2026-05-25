import { prisma } from "@/lib/db";
import { isAdmin } from "@/lib/auth";

export type LikeTargetType = "thought" | "photo";

/** Dev HMR can keep an old PrismaClient without the Like model until restart. */
function likeDelegate():
  | {
      groupBy: typeof prisma.like.groupBy;
      findMany: typeof prisma.like.findMany;
      findUnique: typeof prisma.like.findUnique;
      create: typeof prisma.like.create;
      delete: typeof prisma.like.delete;
    }
  | null {
  const client = prisma as { like?: typeof prisma.like };
  if (!client.like?.groupBy) return null;
  return client.like;
}

export async function assertLikeTargetPublic(
  targetType: LikeTargetType,
  targetId: string
): Promise<boolean> {
  if (targetType === "thought") {
    const thought = await prisma.thought.findUnique({
      where: { id: targetId },
      select: { isPublic: true },
    });
    return !!thought?.isPublic;
  }
  const photo = await prisma.photo.findUnique({
    where: { id: targetId },
    select: { isPublic: true, siteSlot: true },
  });
  return !!photo?.isPublic && photo.siteSlot == null;
}

export async function getLikeStatsForTargets(
  targetType: LikeTargetType,
  targetIds: string[],
  visitorKey: string | null
): Promise<{ counts: Record<string, number>; liked: string[] }> {
  if (targetIds.length === 0) {
    return { counts: {}, liked: [] };
  }

  const like = likeDelegate();
  if (!like) {
    return { counts: {}, liked: [] };
  }

  const grouped = await like.groupBy({
    by: ["targetId"],
    where: { targetType, targetId: { in: targetIds } },
    _count: { _all: true },
  });

  const counts: Record<string, number> = {};
  for (const row of grouped) {
    counts[row.targetId] = row._count._all;
  }

  let liked: string[] = [];
  if (visitorKey && like) {
    const rows = await like.findMany({
      where: { targetType, targetId: { in: targetIds }, visitorKey },
      select: { targetId: true },
    });
    liked = rows.map((r) => r.targetId);
  }

  return { counts, liked };
}

export async function getLikeStatsForOne(
  targetType: LikeTargetType,
  targetId: string,
  visitorKey: string | null
): Promise<{ count: number; liked: boolean }> {
  const { counts, liked } = await getLikeStatsForTargets(
    targetType,
    [targetId],
    visitorKey
  );
  return {
    count: counts[targetId] ?? 0,
    liked: liked.includes(targetId),
  };
}

export async function toggleLike(
  targetType: LikeTargetType,
  targetId: string,
  visitorKey: string
): Promise<{ count: number; liked: boolean }> {
  const admin = await isAdmin();
  if (targetType === "thought") {
    const thought = await prisma.thought.findUnique({
      where: { id: targetId },
      select: { isPublic: true },
    });
    if (!thought) throw new Error("NOT_FOUND");
    if (!thought.isPublic && !admin) throw new Error("FORBIDDEN");
  } else {
    const photo = await prisma.photo.findUnique({
      where: { id: targetId },
      select: { isPublic: true, siteSlot: true },
    });
    if (!photo) throw new Error("NOT_FOUND");
    if ((!photo.isPublic || photo.siteSlot != null) && !admin) {
      throw new Error("FORBIDDEN");
    }
  }

  const like = likeDelegate();
  if (!like) {
    return { count: 0, liked: false };
  }

  const existing = await like.findUnique({
    where: {
      targetType_targetId_visitorKey: {
        targetType,
        targetId,
        visitorKey,
      },
    },
  });

  if (existing) {
    await like.delete({ where: { id: existing.id } });
  } else {
    await like.create({
      data: { targetType, targetId, visitorKey },
    });
  }

  return getLikeStatsForOne(targetType, targetId, visitorKey);
}
