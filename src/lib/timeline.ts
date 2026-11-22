export type TimelineThought = { id: string; createdAt: string };
export type TimelinePhoto = { id: string; filename: string; createdAt: string };
export type TimelineEntry =
  | { kind: "thought"; day: number; at: string; thoughtId: string }
  | { kind: "photos"; day: number; at: string; photos: TimelinePhoto[] };
export type TimelineMonth = { month: number; entries: TimelineEntry[] };
export type TimelineYear = {
  year: number;
  thoughtCount: number;
  photoCount: number;
  months: TimelineMonth[];
};
export type TimelineFilter = "all" | "thoughts" | "photos";

type DayKey = { year: number; month: number; day: number };

function newestFirst(a: { at: string }, b: { at: string }): number {
  return Date.parse(b.at) - Date.parse(a.at);
}

export function buildTimeline(
  thoughts: TimelineThought[],
  photos: TimelinePhoto[],
  timeZone: string,
  filter: TimelineFilter
): TimelineYear[] {
  const format = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  const dayKey = (iso: string): DayKey => {
    const [year, month, day] = format.format(new Date(iso)).split("-").map(Number);
    return { year, month, day };
  };

  const dated: (TimelineEntry & DayKey)[] = [];

  if (filter !== "photos") {
    for (const thought of thoughts) {
      dated.push({
        kind: "thought",
        at: thought.createdAt,
        thoughtId: thought.id,
        ...dayKey(thought.createdAt),
      });
    }
  }

  if (filter !== "thoughts") {
    const byDay = new Map<string, TimelinePhoto[]>();
    for (const photo of photos) {
      const key = format.format(new Date(photo.createdAt));
      byDay.set(key, [...(byDay.get(key) ?? []), photo]);
    }
    for (const group of byDay.values()) {
      const sorted = [...group].sort(
        (a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt)
      );
      dated.push({
        kind: "photos",
        at: sorted[0].createdAt,
        photos: sorted,
        ...dayKey(sorted[0].createdAt),
      });
    }
  }

  dated.sort(newestFirst);

  const years: TimelineYear[] = [];
  for (const { year, month, ...entry } of dated) {
    let yearBlock = years.at(-1);
    if (yearBlock?.year !== year) {
      yearBlock = { year, thoughtCount: 0, photoCount: 0, months: [] };
      years.push(yearBlock);
    }
    let monthBlock = yearBlock.months.at(-1);
    if (monthBlock?.month !== month) {
      monthBlock = { month, entries: [] };
      yearBlock.months.push(monthBlock);
    }
    monthBlock.entries.push(entry);
    if (entry.kind === "thought") yearBlock.thoughtCount += 1;
    else yearBlock.photoCount += entry.photos.length;
  }
  return years;
}
