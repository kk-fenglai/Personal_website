const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 50;

export type Page = { take: number; skip: number };

function toInt(value: string | null, fallback: number): number {
  const parsed = Number.parseInt(value ?? "", 10);
  return Number.isNaN(parsed) ? fallback : parsed;
}

/** 没带 limit 表示调用方要整个列表（后台、时间线） */
export function parsePage(params: URLSearchParams): Page | null {
  if (!params.has("limit")) return null;
  return {
    take: Math.min(MAX_PAGE_SIZE, Math.max(1, toInt(params.get("limit"), DEFAULT_PAGE_SIZE))),
    skip: Math.max(0, toInt(params.get("offset"), 0)),
  };
}
