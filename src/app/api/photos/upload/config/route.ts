import { NextResponse } from "next/server";
import { resolvePhotoUploadConfig } from "@/lib/photoUploadLimits";

export async function GET() {
  return NextResponse.json(resolvePhotoUploadConfig());
}
