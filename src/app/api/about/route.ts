import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth";
import { parseProfileInput } from "@/lib/aboutContent";
import { getAboutProfile, saveAboutProfile } from "@/lib/aboutStore";

export async function GET() {
  return NextResponse.json(await getAboutProfile());
}

export async function PUT(request: Request) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "未授权" }, { status: 401 });
  }
  const parsed = parseProfileInput(await request.json().catch(() => ({})));
  if (!parsed.ok) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }
  return NextResponse.json(await saveAboutProfile(parsed.value));
}
