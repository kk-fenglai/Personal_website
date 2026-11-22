const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 50;
const SEARCH_FIELDS = ["title", "content", "titleEn", "contentEn", "titleFr", "contentFr"] as const;

type SearchField = (typeof SEARCH_FIELDS)[number];
type SearchClause = { [F in SearchField]?: { contains: string; mode: "insensitive" } };

export type ThoughtListWhere = {
  isPublic?: true;
  categoryId?: string | null;
  OR?: SearchClause[];
};

function toInt(value: string | null, fallback: number): number {
  const parsed = Number.parseInt(value ?? "", 10);
  return Number.isNaN(parsed) ? fallback : parsed;
}

/** 没带 limit 表示调用方要整个列表（后台、时间线） */
export function parseThoughtPage(params: URLSearchParams): { take: number; skip: number } | null {
  if (!params.has("limit")) return null;
  return {
    take: Math.min(MAX_PAGE_SIZE, Math.max(1, toInt(params.get("limit"), DEFAULT_PAGE_SIZE))),
    skip: Math.max(0, toInt(params.get("offset"), 0)),
  };
}

export function thoughtListWhere(
  params: URLSearchParams,
  viewer: { admin: boolean }
): ThoughtListWhere {
  const where: ThoughtListWhere = {};
  if (!viewer.admin) where.isPublic = true;

  const category = params.get("category");
  if (category === "uncategorized") where.categoryId = null;
  else if (category && category !== "all") where.categoryId = category;

  const query = params.get("q")?.trim();
  if (query) {
    where.OR = SEARCH_FIELDS.map((field) => ({ [field]: { contains: query, mode: "insensitive" } }));
  }
  return where;
}
