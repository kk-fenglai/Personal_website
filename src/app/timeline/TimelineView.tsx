"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { PhotoImage } from "@/components/PhotoImage";
import { useLocale } from "@/contexts/LocaleContext";
import { pickThoughtContent, pickThoughtTitle } from "@/lib/pickThoughtLocale";
import { plainTextExcerpt } from "@/lib/stitchPlaceholders";
import {
  buildTimeline,
  type TimelineEntry,
  type TimelineFilter,
  type TimelinePhoto,
} from "@/lib/timeline";

type Thought = {
  id: string;
  title: string;
  content: string;
  titleEn?: string | null;
  titleFr?: string | null;
  contentEn?: string | null;
  contentFr?: string | null;
  createdAt: string;
};

const MAX_THUMBS = 3;
const EXCERPT_LENGTH = 90;

async function fetchList<T>(url: string): Promise<T[]> {
  try {
    const res = await fetch(url);
    const data = res.ok ? await res.json() : [];
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

export function TimelineView() {
  const { t, locale, dateLocale } = useLocale();
  const [data, setData] = useState<{ thoughts: Thought[]; photos: TimelinePhoto[] } | null>(null);
  const [filter, setFilter] = useState<TimelineFilter>("all");

  useEffect(() => {
    void Promise.all([
      fetchList<Thought>("/api/thoughts"),
      fetchList<TimelinePhoto>("/api/photos"),
    ]).then(([thoughts, photos]) => setData({ thoughts, photos }));
  }, []);

  const years = useMemo(() => {
    if (!data) return [];
    const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    return buildTimeline(data.thoughts, data.photos, timeZone, filter);
  }, [data, filter]);

  const monthName = useMemo(() => {
    const format = new Intl.DateTimeFormat(dateLocale, { month: "long", timeZone: "UTC" });
    return (month: number) => format.format(new Date(Date.UTC(2000, month - 1, 1)));
  }, [dateLocale]);

  if (!data) {
    return <div className="py-20 section-label text-muted">{t("thoughts.loading")}</div>;
  }

  const thoughtCount = data.thoughts.length;
  const photoCount = data.photos.length;
  if (thoughtCount + photoCount === 0) {
    return <p className="py-20 type-body-lg text-muted">{t("timeline.empty")}</p>;
  }

  const thoughtsById = new Map(data.thoughts.map((thought) => [thought.id, thought]));
  const filters: { value: TimelineFilter; label: string; count: number }[] = [
    { value: "all", label: t("timeline.filterAll"), count: thoughtCount + photoCount },
    { value: "thoughts", label: t("timeline.filterThoughts"), count: thoughtCount },
    { value: "photos", label: t("timeline.filterPhotos"), count: photoCount },
  ];

  const renderEntry = (entry: TimelineEntry) => {
    const day = String(entry.day).padStart(2, "0");
    if (entry.kind === "thought") {
      const thought = thoughtsById.get(entry.thoughtId);
      if (!thought) return null;
      const excerpt = plainTextExcerpt(pickThoughtContent(thought, locale), EXCERPT_LENGTH);
      return (
        <Link key={entry.thoughtId} href={`/thoughts/${thought.id}`} className="timeline-entry">
          <span className="timeline-day tabular-nums">{day}</span>
          <div className="min-w-0">
            <span className="timeline-kind">{t("timeline.kindThought")}</span>
            <h3 className="timeline-entry-title type-headline-sm text-fg">
              {pickThoughtTitle(thought, locale)}
            </h3>
            {excerpt && <p className="text-muted reading mt-1">{excerpt}</p>}
          </div>
        </Link>
      );
    }
    const extra = entry.photos.length - MAX_THUMBS;
    return (
      <Link key={entry.photos[0].id} href="/gallery" className="timeline-entry">
        <span className="timeline-day tabular-nums">{day}</span>
        <div className="min-w-0">
          <span className="timeline-kind">
            {t("timeline.kindPhotos", { count: entry.photos.length })}
          </span>
          <h3 className="timeline-entry-title type-headline-sm text-fg">
            {t("timeline.photosTitle")}
          </h3>
          <div className="timeline-strip">
            {entry.photos.slice(0, MAX_THUMBS).map((photo) => (
              <div key={photo.id} className="timeline-thumb">
                <PhotoImage src={photo.filename} alt="" fill sizes="160px" className="object-cover" />
              </div>
            ))}
            {extra > 0 && <div className="timeline-thumb timeline-thumb-more">+{extra}</div>}
          </div>
        </div>
      </Link>
    );
  };

  return (
    <>
      <div className="timeline-filters">
        {filters.map((item) => (
          <button
            key={item.value}
            type="button"
            onClick={() => setFilter(item.value)}
            aria-pressed={filter === item.value}
            className={filter === item.value ? "filter-tab filter-tab-active" : "filter-tab"}
          >
            {item.label}
            <span className="timeline-filter-count tabular-nums">{item.count}</span>
          </button>
        ))}
      </div>

      {years.map((year) => (
        <section key={year.year} className="timeline-year">
          <div className="timeline-year-head">
            <div className="timeline-year-sticky">
              <div className="timeline-year-num tabular-nums">{year.year}</div>
              <p className="type-caption mt-3">
                {t("timeline.yearSummary", {
                  thoughts: year.thoughtCount,
                  photos: year.photoCount,
                })}
              </p>
            </div>
          </div>
          <div className="timeline-year-body">
            {year.months.map((month) => (
              <div key={month.month} className="timeline-month">
                <span className="section-label block mb-2">{monthName(month.month)}</span>
                {month.entries.map(renderEntry)}
              </div>
            ))}
          </div>
        </section>
      ))}
    </>
  );
}
