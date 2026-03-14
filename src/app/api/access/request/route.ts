import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const name = String(body.name || "").trim();
  const contact = body.contact != null ? String(body.contact).trim().slice(0, 200) : null;
  const message = body.message != null ? String(body.message).trim().slice(0, 1000) : null;

  if (!name) {
    return NextResponse.json({ error: "请填写称呼" }, { status: 400 });
  }

  const req = await prisma.accessRequest.create({
    data: { name, contact, message },
  });
  return NextResponse.json({ success: true, id: req.id });
}
