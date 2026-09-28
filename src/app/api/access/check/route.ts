import { NextResponse } from "next/server";
import { isAdmin, isApprovedVisitor } from "@/lib/auth";

export async function GET() {
  if (await isAdmin()) {
    return NextResponse.json({ allowed: true, role: "admin" });
  }
  if (await isApprovedVisitor()) {
    return NextResponse.json({ allowed: true, role: "visitor" });
  }
  return NextResponse.json({ allowed: false });
}
