import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth";
import { parseProjectInput } from "@/lib/aboutContent";
import { createProject, listProjects } from "@/lib/aboutStore";

export async function GET() {
  return NextResponse.json(await listProjects({ includeHidden: await isAdmin() }));
}

export async function POST(request: Request) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "未授权" }, { status: 401 });
  }
  const parsed = parseProjectInput(await request.json().catch(() => ({})));
  if (!parsed.ok) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }
  return NextResponse.json(await createProject(parsed.value));
}
