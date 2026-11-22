import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { isAdmin, isApprovedVisitor } from "@/lib/auth";
import { translateAndSaveThought } from "@/lib/thoughtTranslateAndSave";
import { scheduleThoughtTranslationBackfill } from "@/lib/ensureThoughtTranslations";
import { parseListLocale, toListView } from "@/lib/thoughtListView";
import { parsePage } from "@/lib/paging";
import { thoughtListWhere } from "@/lib/thoughtListQuery";

export async function GET(request: NextRequest) {
  const admin = await isAdmin();
  if (!admin && !(await isApprovedVisitor())) {
    return NextResponse.json({ error: "需要访问许可" }, { status: 401 });
  }
  const params = request.nextUrl.searchParams;
  const where = thoughtListWhere(params, { admin });
  const page = parsePage(params);
  const [thoughts, total] = await Promise.all([
    prisma.thought.findMany({
      where,
      orderBy: [
        { isPinned: "desc" },
        { pinnedOrder: "asc" },
        { createdAt: "desc" },
        { id: "asc" },
      ],
      include: {
        category: true,
        comments: { orderBy: { createdAt: "asc" } },
      },
      ...(page ?? {}),
    }),
    page ? prisma.thought.count({ where }) : null,
  ]);
  scheduleThoughtTranslationBackfill(thoughts);

  const locale = parseListLocale(params.get("locale"));
  const excerpt = params.get("excerpt") === "1";
  const items = locale
    ? thoughts.map((thought) => toListView(thought, locale, { excerpt }))
    : thoughts;
  if (!page || total === null) return NextResponse.json(items);
  return NextResponse.json({ items, total, hasMore: page.skip + thoughts.length < total });
}

export async function POST(request: NextRequest) {
  const admin = await isAdmin();
  if (!admin) {
    return NextResponse.json({ error: "未授权" }, { status: 401 });
  }
  const body = await request.json();
  const { title, content, isPublic = true, categoryId } = body;
  if (!title || !content) {
    return NextResponse.json(
      { error: "标题和内容不能为空" },
      { status: 400 }
    );
  }
  const thought = await prisma.thought.create({
    data: {
      title,
      content,
      isPublic: !!isPublic,
      ...(categoryId ? { categoryId } : {}),
    },
  });
  await translateAndSaveThought(thought.id, thought.title, thought.content);
  const fresh = await prisma.thought.findUnique({
    where: { id: thought.id },
    include: { category: true, comments: { orderBy: { createdAt: "asc" } } },
  });
  return NextResponse.json(fresh ?? thought);
}
