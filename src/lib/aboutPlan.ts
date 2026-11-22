export function planTranslationReset<F extends string>(
  prev: Record<F, string>,
  next: Record<F, string>,
  fields: readonly F[]
): F[] {
  return fields.filter((field) => prev[field] !== next[field]);
}

export function neighborToSwap<T extends { id: string; sortOrder: number }>(
  items: T[],
  id: string,
  direction: "up" | "down"
): T | null {
  const ordered = [...items].sort(
    (a, b) => a.sortOrder - b.sortOrder || a.id.localeCompare(b.id)
  );
  const index = ordered.findIndex((item) => item.id === id);
  if (index === -1) return null;
  return ordered[direction === "up" ? index - 1 : index + 1] ?? null;
}

/**
 * 译文写回的条件与内容：只有中文仍是当时送去翻译的那一版才写入，
 * 避免先发出的翻译晚到，盖掉之后保存的内容。
 */
export function translationWrite(
  id: string,
  field: string,
  zh: string,
  tr: { en: string; fr: string }
): { where: Record<string, string>; data: Record<string, string> } {
  return {
    where: { id, [field]: zh },
    data: { [`${field}En`]: tr.en, [`${field}Fr`]: tr.fr },
  };
}
