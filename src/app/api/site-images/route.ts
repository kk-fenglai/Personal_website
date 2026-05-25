import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import {
  SITE_SLOT_ABOUT_PORTRAIT,
  SITE_SLOT_HOME_HERO,
  homePreviewSlot,
} from "@/lib/siteSlots";

type SlotPhoto = {
  id: string;
  filename: string;
  caption: string | null;
};

export async function GET() {
  const assigned = await prisma.photo.findMany({
    where: {
      siteSlot: { not: null },
      isPublic: true,
    },
  });

  const bySlot = new Map(
    assigned.map((p) => [p.siteSlot!, { id: p.id, filename: p.filename, caption: p.caption }])
  );

  const home_preview: (SlotPhoto | null)[] = Array.from({ length: 5 }, (_, i) =>
    bySlot.get(homePreviewSlot(i)) ?? null
  );

  return NextResponse.json({
    home_hero: bySlot.get(SITE_SLOT_HOME_HERO) ?? null,
    about_portrait: bySlot.get(SITE_SLOT_ABOUT_PORTRAIT) ?? null,
    home_preview,
  });
}
