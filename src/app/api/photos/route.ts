import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { isAdmin } from "@/lib/auth";

export async function GET() {
  const admin = await isAdmin();
  const photos = await prisma.photo.findMany({
    where: admin ? undefined : { isPublic: true },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(photos);
}
