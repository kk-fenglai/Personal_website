import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth";
import { moveProject } from "@/lib/aboutStore";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "未授权" }, { status: 401 });
  }
  const body = (await request.json().catch(() => ({}))) as { direction?: unknown };
  if (body.direction !== "up" && body.direction !== "down") {
    return NextResponse.json({ error: "方向无效" }, { status: 400 });
  }
  return NextResponse.json({ ok: await moveProject((await params).id, body.direction) });
}
