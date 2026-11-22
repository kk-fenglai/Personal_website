import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth";
import { parseProjectInput } from "@/lib/aboutContent";
import { deleteProject, updateProject } from "@/lib/aboutStore";

type Context = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: Context) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "未授权" }, { status: 401 });
  }
  const parsed = parseProjectInput(await request.json().catch(() => ({})));
  if (!parsed.ok) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }
  const project = await updateProject((await params).id, parsed.value);
  if (!project) {
    return NextResponse.json({ error: "项目不存在" }, { status: 404 });
  }
  return NextResponse.json(project);
}

export async function DELETE(_request: Request, { params }: Context) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "未授权" }, { status: 401 });
  }
  if (!(await deleteProject((await params).id))) {
    return NextResponse.json({ error: "项目不存在" }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}
