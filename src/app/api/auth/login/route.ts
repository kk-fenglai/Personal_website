import { NextRequest, NextResponse } from "next/server";
import { verifyAdminPassword } from "@/lib/auth";
import { setAdminSession } from "@/lib/auth";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { username, password } = body;
  if (!username || !password) {
    return NextResponse.json(
      { error: "请填写用户名和密码" },
      { status: 400 }
    );
  }
  const ok = await verifyAdminPassword(username, password);
  if (!ok) {
    return NextResponse.json(
      { error: "用户名或密码错误" },
      { status: 401 }
    );
  }
  await setAdminSession();
  return NextResponse.json({ success: true });
}
