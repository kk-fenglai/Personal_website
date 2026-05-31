import { translateAndSaveThought } from "@/lib/thoughtTranslateAndSave";

export type ThoughtTranslationFields = {
  id: string;
  title: string;
  content: string;
  titleEn?: string | null;
  titleFr?: string | null;
  contentEn?: string | null;
  contentFr?: string | null;
};

function fieldMissing(value: string | null | undefined): boolean {
  return !value?.trim();
}

/** 是否缺少英/法译文（任一字段为空即需补翻） */
export function thoughtNeedsTranslation(thought: ThoughtTranslationFields): boolean {
  return (
    fieldMissing(thought.titleEn) ||
    fieldMissing(thought.contentEn) ||
    fieldMissing(thought.titleFr) ||
    fieldMissing(thought.contentFr)
  );
}

/** 缺译文时调用 LibreTranslate 并写回数据库 */
export async function ensureThoughtTranslations(
  id: string,
  title: string,
  content: string
): Promise<void> {
  await translateAndSaveThought(id, title, content);
}

/** 后台限流补翻：最多处理 limit 篇缺译文的随想 */
export function scheduleThoughtTranslationBackfill(
  thoughts: ThoughtTranslationFields[],
  limit = 3
): void {
  const pending = thoughts.filter(thoughtNeedsTranslation).slice(0, limit);
  for (const thought of pending) {
    void ensureThoughtTranslations(thought.id, thought.title, thought.content);
  }
}
