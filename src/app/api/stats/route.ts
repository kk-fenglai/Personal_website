import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  const [thoughtsCount, photosCount] = await Promise.all([
    prisma.thought.count({ where: { isPublic: true } }),
    prisma.photo.count({ where: { isPublic: true } }),
  ]);
  return NextResponse.json({ thoughts: thoughtsCount, photos: photosCount });
}
