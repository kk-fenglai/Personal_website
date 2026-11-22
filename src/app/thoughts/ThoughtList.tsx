"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ScrollReveal } from "@/components/ScrollReveal";
import { useLocale } from "@/contexts/LocaleContext";

type Thought = {
  id: string;
  title: string;
  content: string;
  isPublic: boolean;
  isPinned?: boolean;
  category?: { id: string; name: string } | null;
  createdAt: string;
};

type Category = { id: string; name: string };

function formatEditorialDate(iso: string, dateLocale: string) {
  return new Date(iso)
    .toLocaleDateString(dateLocale, { year: "numeric", month: "short", day: "numeric" })
    .toUpperCase();
}

const PAGE_SIZE = 20;
const SEARCH_DELAY_MS = 300;

type Page = { items: Thought[]; total: number; hasMore: boolean };

export function ThoughtList() {
  const { t, dateLocale, locale } = useLocale();
  const [page, setPage] = useState<{ key: string; items: Thought[]; hasMore: boolean } | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [query, setQuery] = useState("");
  const [search, setSearch] = useState("");
  const sentinel = useRef<HTMLDivElement | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();

  const selectedCategoryId = searchParams.get("category") || "all";
  const listKey = `${locale}|${selectedCategoryId}|${search}`;
  const current = page?.key === listKey ? page : null;

  useEffect(() => {
    fetch("/api/thought-categories")
      .then((res) => res.json())
      .then((cData) => {
        setCategories(Array.isArray(cData) ? cData : []);
      });
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => setSearch(query.trim()), SEARCH_DELAY_MS);
    return () => clearTimeout(timer);
  }, [query]);

  const fetchPage = useCallback(
    async (offset: number, signal?: AbortSignal): Promise<Page> => {
      const params = new URLSearchParams({
        locale,
        excerpt: "1",
        limit: String(PAGE_SIZE),
        offset: String(offset),
        category: selectedCategoryId,
      });
      if (search) params.set("q", search);
      const res = await fetch(`/api/thoughts?${params}`, { signal });
      const data = await res.json();
      return Array.isArray(data?.items) ? data : { items: [], total: 0, hasMore: false };
    },
    [locale, selectedCategoryId, search]
  );

  useEffect(() => {
    const controller = new AbortController();
    fetchPage(0, controller.signal)
      .then((data) => setPage({ key: listKey, items: data.items, hasMore: data.hasMore }))
      .catch(() => {
        if (!controller.signal.aborted) setPage({ key: listKey, items: [], hasMore: false });
      });
    return () => controller.abort();
  }, [fetchPage, listKey]);

  const loadMore = useCallback(async () => {
    if (!current?.hasMore || loadingMore) return;
    setLoadingMore(true);
    try {
      const data = await fetchPage(current.items.length);
      setPage((prev) =>
        prev?.key === listKey
          ? { key: listKey, items: [...prev.items, ...data.items], hasMore: data.hasMore }
          : prev
      );
    } finally {
      setLoadingMore(false);
    }
  }, [current, loadingMore, fetchPage, listKey]);

  useEffect(() => {
    const node = sentinel.current;
    if (!node) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) void loadMore();
      },
      { rootMargin: "800px 0px" }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [loadMore]);

  const filtered = current?.items ?? [];
  const isFiltered = selectedCategoryId !== "all" || search !== "";

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

      {!current ? (
        <div className="py-20 text-muted tabular-nums">{t("thoughts.loading")}</div>
      ) : filtered.length === 0 ? (
        <p className="py-12 text-muted">
          {t(isFiltered ? "thoughts.emptyInFolder" : "thoughts.empty")}
        </p>
      ) : (
        <section className="space-y-24 md:space-y-32">
          {filtered.map((item) => {
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
                        {item.title}
                      </h2>
                      <p className="type-body-lg text-muted max-w-[600px] reading line-clamp-4">
                        {item.content}
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
      <div ref={sentinel} aria-hidden />
      {loadingMore && (
        <div className="py-12 text-muted tabular-nums">{t("thoughts.loading")}</div>
      )}
    </>
  );
}
