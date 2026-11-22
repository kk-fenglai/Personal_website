const SEARCH_FIELDS = ["title", "content", "titleEn", "contentEn", "titleFr", "contentFr"] as const;

type SearchField = (typeof SEARCH_FIELDS)[number];
type SearchClause = { [F in SearchField]?: { contains: string; mode: "insensitive" } };

export type ThoughtListWhere = {
  isPublic?: true;
  categoryId?: string | null;
  OR?: SearchClause[];
};

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
