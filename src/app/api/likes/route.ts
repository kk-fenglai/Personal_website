import { NextRequest, NextResponse } from "next/server";
import {
  assertLikeTargetPublic,
  getLikeStatsForTargets,
  toggleLike,
  type LikeTargetType,
} from "@/lib/likes";
import {
  attachVisitorLikeCookie,
  getVisitorLikeKeyFromRequest,
} from "@/lib/visitorLikeKey";

function parseTargetType(value: string | null): LikeTargetType | null {
  if (value === "thought" || value === "photo") return value;
  return null;
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const targetType = parseTargetType(searchParams.get("targetType"));
  const idsParam = searchParams.get("ids") ?? "";

  if (!targetType) {
    return NextResponse.json({ error: "Invalid targetType" }, { status: 400 });
  }

  const ids = [
    ...new Set(
      idsParam
        .split(",")
        .map((id) => id.trim())
        .filter(Boolean)
    ),
  ].slice(0, 100);

  if (ids.length === 0) {
    return NextResponse.json({ counts: {}, liked: [] });
  }

  const { key: visitorKey } = getVisitorLikeKeyFromRequest(request);
  const stats = await getLikeStatsForTargets(targetType, ids, visitorKey);
  return NextResponse.json(stats);
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}));
  const targetType = parseTargetType(
    typeof body.targetType === "string" ? body.targetType : null
  );
  const targetId =
    typeof body.targetId === "string" ? body.targetId.trim() : "";

  if (!targetType || !targetId) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const allowed = await assertLikeTargetPublic(targetType, targetId);
  if (!allowed) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const { key: visitorKey, isNew } = getVisitorLikeKeyFromRequest(request);

  try {
    const result = await toggleLike(targetType, targetId, visitorKey);
    const res = NextResponse.json({
      targetType,
      targetId,
      count: result.count,
      liked: result.liked,
    });
    return attachVisitorLikeCookie(res, visitorKey, isNew);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "";
    if (msg === "NOT_FOUND") {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    if (msg === "FORBIDDEN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    throw e;
  }
}
