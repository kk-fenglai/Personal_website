import { NextRequest, NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth";
import { createPhotoRecord } from "@/lib/photoStorage";

export async function POST(request: NextRequest) {
  try {
    const admin = await isAdmin();
    if (!admin) {
      return NextResponse.json({ error: "未授权，请先登录管理后台" }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const filename =
      typeof body.filename === "string" ? body.filename.trim() : "";
    const caption = typeof body.caption === "string" ? body.caption : "";
    const siteSlot =
      typeof body.siteSlot === "string" ? body.siteSlot.trim() : "";
    const isPublic = body.isPublic !== false;

    if (!filename) {
      return NextResponse.json({ error: "缺少图片地址" }, { status: 400 });
    }

    const photo = await createPhotoRecord({
      filename,
      caption,
      isPublic,
      siteSlot: siteSlot || null,
    });
    return NextResponse.json(photo);
  } catch (e) {
    console.error("[photos/register]", e);
    const msg = e instanceof Error ? e.message : "保存失败";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
