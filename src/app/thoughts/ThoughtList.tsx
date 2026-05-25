"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ScrollReveal } from "@/components/ScrollReveal";
import { useLocale } from "@/contexts/LocaleContext";
import { plainTextExcerpt } from "@/lib/stitchPlaceholders";
import {
  pickThoughtContent,
  pickThoughtTitle,
} from "@/lib/pickThoughtLocale";

type Thought = {
  id: string;
  title: string;
  content: string;
  titleEn?: string | null;
  titleFr?: string | null;
  contentEn?: string | null;
  contentFr?: string | null;
  isPublic: boolean;
  isPinned?: boolean;
  category?: { id: string; name: string } | null;
  createdAt: string;
  comments: { id: string }[];
};

type Category = { id: string; name: string };

function formatEditorialDate(iso: string, dateLocale: string) {
  return new Date(iso)
    .toLocaleDateString(dateLocale, { year: "numeric", month: "short", day: "numeric" })
    .toUpperCase();
}

export function ThoughtList() {
  const { t, dateLocale, locale } = useLocale();
  const [thoughts, setThoughts] = useState<Thought[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const router = useRouter();
  const searchParams = useSearchParams();

  const selectedCategoryId = searchParams.get("category") || "all";

  useEffect(() => {
    Promise.all([
      fetch("/api/thoughts").then((res) => res.json()),
      fetch("/api/thought-categories").then((res) => res.json()),
    ])
      .then(([tData, cData]) => {
        setThoughts(Array.isArray(tData) ? tData : []);
        setCategories(Array.isArray(cData) ? cData : []);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="py-20 text-muted tabular-nums">{t("thoughts.loading")}</div>;
  }

  if (thoughts.length === 0) {
    return <p className="py-20 text-muted">{t("thoughts.empty")}</p>;
  }

  const normalizedQuery = query.trim().toLowerCase();
  const matchesQuery = (item: Thought) => {
    if (!normalizedQuery) return true;
    const title = pickThoughtTitle(item, locale) ?? "";
    const content = pickThoughtContent(item, locale) ?? "";
    return `${title}\n${content}`.toLowerCase().includes(normalizedQuery);
  };

  const filtered = thoughts
    .filter((item) => {
      if (selectedCategoryId === "all") return true;
      if (selectedCategoryId === "uncategorized") return !item.category?.id;
      return item.category?.id === selectedCategoryId;
    })
    .filter(matchesQuery);

  const setCategory = (id: string) => {
    const url = id === "all" ? "/thoughts" : `/thoughts?category=${encodeURIComponent(id)}`;
    router.push(url);
  };

  const filterItems = [
    { id: "all", label: t("thoughts.all") },
    { id: "uncategorized", label: t("thoughts.uncategorized") },
    ...categories.map((c) => ({ id: c.id, label: c.name })),
  ];

  return (
    <>
      <nav className="flex flex-wrap gap-x-8 gap-y-4 mb-8">
        {filterItems.map((c) => (
          <button
            key={c.id}
            type="button"
            onClick={() => setCategory(c.id)}
            className={
              selectedCategoryId === c.id ? "filter-tab filter-tab-active" : "filter-tab"
            }
          >
            {c.label}
          </button>
        ))}
      </nav>

      <div className="mb-16 border-b border-border pb-4">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full bg-transparent border-none focus:ring-0 text-base placeholder:text-muted/50 py-2"
          placeholder={t("thoughts.searchPlaceholder")}
          aria-label={t("thoughts.search")}
        />
      </div>

      {filtered.length === 0 ? (
        <p className="py-12 text-muted">{t("thoughts.emptyInFolder")}</p>
      ) : (
        <section className="space-y-24 md:space-y-32">
          {filtered.map((item) => {
            const body = pickThoughtContent(item, locale) ?? "";

            return (
              <ScrollReveal key={item.id}>
                <article className="asymmetric-entry group">
                  <div className="flex flex-col gap-6">
                    <div className="flex flex-wrap items-center gap-4">
                      <time
                        className="section-label !text-muted tabular-nums"
                        dateTime={item.createdAt}
                      >
                        {formatEditorialDate(item.createdAt, dateLocale)}
                      </time>
                      <span className="w-1 h-1 bg-border rounded-full" aria-hidden />
                      {item.category?.name && (
                        <span className="section-label">{item.category.name}</span>
                      )}
                      {item.isPinned && (
                        <span className="status-badge px-2 py-0.5">{t("thoughts.pinned")}</span>
                      )}
                    </div>
                    <Link
                      href={`/thoughts/${item.id}`}
                      className="block group-hover:opacity-80 transition-opacity"
                    >
                      <h2 className="type-headline-md text-fg leading-tight mb-4 group-hover:text-warm transition-colors">
                        {pickThoughtTitle(item, locale)}
                      </h2>
                      <p className="type-body-lg text-muted max-w-[600px] reading line-clamp-4">
                        {plainTextExcerpt(body)}
                      </p>
                    </Link>
                    <Link href={`/thoughts/${item.id}`} className="read-article-link">
                      {t("common.readArticle")}
                    </Link>
                  </div>
                </article>
              </ScrollReveal>
            );
          })}
        </section>
      )}
    </>
  );
}
