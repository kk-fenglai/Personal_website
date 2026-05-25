import { prisma } from "@/lib/db";
import { isSiteSlot } from "@/lib/siteSlots";

export type CreatePhotoInput = {
  filename: string;
  caption?: string;
  isPublic?: boolean;
  siteSlot?: string | null;
};

export function isAllowedPhotoUrl(url: string): boolean {
  if (url.startsWith("/uploads/")) return true;
  if (url.startsWith("https://") && url.includes(".blob.")) return true;
  return false;
}

export async function createPhotoRecord(input: CreatePhotoInput) {
  const siteSlot =
    input.siteSlot && isSiteSlot(input.siteSlot) ? input.siteSlot : null;
  const isPublic = siteSlot ? true : input.isPublic !== false;
  const caption = (input.caption ?? "").slice(0, 500) || null;

  if (!isAllowedPhotoUrl(input.filename)) {
    throw new Error("无效的图片地址");
  }

  if (siteSlot) {
    const existing = await prisma.photo.findFirst({ where: { siteSlot } });
    if (existing) {
      await prisma.photo.delete({ where: { id: existing.id } });
    }
  }

  return prisma.photo.create({
    data: {
      filename: input.filename,
      caption,
      isPublic,
      ...(siteSlot ? { siteSlot } : {}),
    },
  });
}
