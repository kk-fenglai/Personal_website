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
