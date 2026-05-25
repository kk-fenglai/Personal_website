"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useLocale } from "@/contexts/LocaleContext";
import { FormattedContent } from "@/components/FormattedContent";
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
    return (
      <div className="py-20 text-muted tabular-nums">{t("thoughts.loading")}</div>
    );
  }

  if (thoughts.length === 0) {
    return (
      <p className="py-20 text-muted">{t("thoughts.empty")}</p>
    );
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

  const allCount = thoughts.length;
  const uncategorizedCount = thoughts.filter((x) => !x.category?.id).length;
  const countsById = thoughts.reduce<Record<string, number>>((acc, item) => {
    const id = item.category?.id;
    if (!id) return acc;
    acc[id] = (acc[id] || 0) + 1;
    return acc;
  }, {});

  const setCategory = (id: string) => {
    const url = id === "all" ? "/thoughts" : `/thoughts?category=${encodeURIComponent(id)}`;
    router.push(url);
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[15rem_minmax(0,1fr)]">
      <aside className="card p-3 sm:p-4 h-fit lg:sticky lg:top-24 space-y-4">
        <div>
          <p className="section-label mb-2">{t("thoughts.folders")}</p>
          <div className="lg:hidden">
            <select
              value={selectedCategoryId}
              onChange={(e) => setCategory(e.target.value)}
              className="form-control"
            >
              <option value="all">{t("thoughts.all")} ({allCount})</option>
              <option value="uncategorized">{t("thoughts.uncategorized")} ({uncategorizedCount})</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({countsById[c.id] || 0})
                </option>
              ))}
            </select>
          </div>
          <ul className="hidden lg:block space-y-1">
            {[
              { id: "all", name: t("thoughts.all"), count: allCount },
              { id: "uncategorized", name: t("thoughts.uncategorized"), count: uncategorizedCount },
              ...categories.map((c) => ({ id: c.id, name: c.name, count: countsById[c.id] || 0 })),
            ].map((c) => {
              const active = selectedCategoryId === c.id;
              return (
                <li key={c.id}>
                  <button
                    type="button"
                    onClick={() => setCategory(c.id)}
                    className={`w-full text-left px-2.5 py-1.5 rounded-[var(--radius-control)] transition-colors ${
                      active ? "bg-bg-card text-fg" : "text-muted hover:text-fg hover:bg-bg-card"
                    }`}
                  >
                    <span className="flex items-center justify-between gap-3">
                      <span className="truncate">{c.name}</span>
                      <span className="tabular-nums text-sm">{c.count}</span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>

        <div>
          <label className="block section-label mb-2">{t("thoughts.search")}</label>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="form-control"
            placeholder={t("thoughts.searchPlaceholder")}
          />
        </div>
      </aside>

      <section className="space-y-4">
        {filtered.length === 0 ? (
          <p className="py-12 text-muted">{t("thoughts.emptyInFolder")}</p>
        ) : (
          <ul className="editorial-list space-y-4 sm:space-y-5">
            {filtered.map((item, i) => (
              <li
                key={item.id}
                className="animate-in"
                style={{ animationDelay: `${0.04 * i}s`, opacity: 0 }}
              >
                <Link href={`/thoughts/${item.id}`} className="card p-6 sm:p-8 block">
                  <div className="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-start">
                    <div className="min-w-0">
                      <h2 className="text-3xl sm:text-4xl text-fg font-semibold tracking-tight">
                        {pickThoughtTitle(item, locale)}
                      </h2>
                      <div className="mt-2 flex flex-wrap items-center gap-2">
                        {item.isPinned && (
                          <span className="status-badge text-xs px-2 py-0.5">
                            {t("thoughts.pinned")}
                          </span>
                        )}
                        {item.category?.name && (
                          <span className="status-badge text-xs px-2 py-0.5">
                            #{item.category.name}
                          </span>
                        )}
                      </div>
                    </div>
                    <span className="text-muted text-sm sm:text-base tabular-nums sm:text-right">
                      {new Date(item.createdAt).toLocaleDateString(dateLocale)}
                      {item.comments.length > 0 && ` · ${t("thoughts.commentsCount", { count: item.comments.length })}`}
                    </span>
                  </div>
                  <p className="mt-4 text-muted text-base line-clamp-2 reading max-w-3xl">
                    <FormattedContent
                      content={pickThoughtContent(item, locale)}
                      stripImages
                      as="span"
                    />
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
