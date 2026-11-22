import { pickThoughtContent, pickThoughtTitle } from "@/lib/pickThoughtLocale";
import { plainTextExcerpt } from "@/lib/stitchPlaceholders";
import type { Locale } from "@/lib/translations";

const LOCALES: readonly Locale[] = ["zh", "en", "fr"];
const DROPPED = ["titleEn", "titleFr", "contentEn", "contentFr", "comments"] as const;

type FullThought = {
  title: string;
  titleEn?: string | null;
  titleFr?: string | null;
  content: string;
  contentEn?: string | null;
  contentFr?: string | null;
  comments?: unknown[];
};

export type ThoughtListView<T extends FullThought> = Omit<
  T,
  "titleEn" | "titleFr" | "contentEn" | "contentFr" | "comments"
> & { commentCount: number };

export function parseListLocale(value: string | null): Locale | null {
  return LOCALES.find((locale) => locale === value) ?? null;
}

/** 列表用的精简随想：只带一种语言的标题和正文，评论只留数量 */
export function toListView<T extends FullThought>(
  thought: T,
  locale: Locale,
  opts: { excerpt: boolean }
): ThoughtListView<T> {
  const rest: Record<string, unknown> = { ...thought };
  for (const key of DROPPED) delete rest[key];
  const content = pickThoughtContent(thought, locale);
  return {
    ...(rest as Omit<T, (typeof DROPPED)[number]>),
    title: pickThoughtTitle(thought, locale),
    content: opts.excerpt ? plainTextExcerpt(content) : content,
    commentCount: thought.comments?.length ?? 0,
  };
}
