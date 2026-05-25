"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ScrollReveal } from "@/components/ScrollReveal";
import { useLocale } from "@/contexts/LocaleContext";
import { FormattedContent } from "@/components/FormattedContent";
import { LikeButton } from "@/components/LikeButton";
import {
  isShowingMachineTranslation,
  pickThoughtContent,
  pickThoughtTitle,
} from "@/lib/pickThoughtLocale";

type Comment = {
  id: string;
  author: string;
  content: string;
  createdAt: string;
};

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
  comments: Comment[];
  likeCount?: number;
  likedByVisitor?: boolean;
};

export function ThoughtDetail({ thoughtId }: { thoughtId: string }) {
  const { t, dateLocale, locale } = useLocale();
  const [thought, setThought] = useState<Thought | null>(null);
  const [loading, setLoading] = useState(true);
  const [author, setAuthor] = useState("");
  const [content, setContent] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch(`/api/thoughts/${thoughtId}`)
      .then(async (res) => {
        const data = await res.json().catch(() => null);
        if (!res.ok || !data?.id) {
          return null;
        }
        return data as Thought;
      })
      .then((data) => {
        setThought(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [thoughtId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!thought) return;
    setError("");
    setSubmitting(true);
    try {
      const res = await fetch(`/api/thoughts/${thought.id}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ author: author.trim(), content: content.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || t("common.errorNetwork"));
        return;
      }
      setThought((prev) =>
        prev ? { ...prev, comments: [...prev.comments, data] } : null
      );
      setAuthor("");
      setContent("");
    } catch {
      setError(t("common.errorNetwork"));
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="site-container mx-auto stitch-narrow py-20 text-muted tabular-nums">
        {t("common.loading")}
      </div>
    );
  }

  if (!thought) {
    return (
      <div className="site-container mx-auto stitch-narrow py-20 text-center">
        <p className="text-muted">{t("thoughtDetail.notFound")}</p>
        <Link href="/thoughts" className="mt-6 inline-block read-article-link">
          {t("thoughtDetail.backToList")}
        </Link>
      </div>
    );
  }

  return (
    <article className="site-container mx-auto stitch-narrow pb-20 editorial-stack">
      <Link href="/thoughts" className="read-article-link mb-8 inline-flex">
        ← {t("thoughtDetail.back")}
      </Link>

      <header className="mb-16 md:mb-20">
        <ScrollReveal>
          <div className="flex flex-wrap items-center gap-4 mb-6">
            <time
              className="section-label !text-muted tabular-nums"
              dateTime={thought.createdAt}
            >
              {new Date(thought.createdAt).toLocaleString(dateLocale)}
            </time>
            {thought.category?.name && (
              <>
                <span className="w-1 h-1 bg-border rounded-full" aria-hidden />
                <span className="section-label">{thought.category.name}</span>
              </>
            )}
            {thought.isPinned && (
              <span className="status-badge px-2 py-0.5">{t("thoughts.pinned")}</span>
            )}
          </div>
          <h1 className="type-display-lg text-fg">{pickThoughtTitle(thought, locale)}</h1>
          {isShowingMachineTranslation(thought, locale) && (
            <p className="mt-4 type-caption">{t("thoughts.machineTranslationNote")}</p>
          )}
          <div className="stitch-gold-line mt-8" />
        </ScrollReveal>
      </header>

      <ScrollReveal>
        <FormattedContent
          content={pickThoughtContent(thought, locale)}
          as="div"
          className="text-fg reading whitespace-pre-wrap type-body-lg max-w-none prose-stitch"
        />
      </ScrollReveal>

      <ScrollReveal className="mt-12 md:mt-16">
        <LikeButton
          targetType="thought"
          targetId={thought.id}
          initialCount={thought.likeCount}
          initialLiked={thought.likedByVisitor}
          skipFetch={thought.likeCount !== undefined}
        />
      </ScrollReveal>

      <section className="border-t border-border pt-12 md:pt-16 mt-12 md:mt-16">
        <h2 className="section-label mb-8">
          {t("thoughtDetail.comments")} ({thought.comments.length})
        </h2>
        <ul className="space-y-8">
          {thought.comments.map((c) => (
            <li key={c.id} className="border-b border-border pb-8 last:border-0">
              <div className="flex items-baseline gap-3 type-caption">
                <span className="font-bold text-fg uppercase tracking-wider">{c.author}</span>
                <time dateTime={c.createdAt}>{new Date(c.createdAt).toLocaleString(dateLocale)}</time>
              </div>
              <p className="mt-3 text-fg reading">{c.content}</p>
            </li>
          ))}
        </ul>

        <form onSubmit={handleSubmit} className="mt-12 space-y-6 max-w-lg">
          {error && <p className="danger-text text-sm">{error}</p>}
          <div className="border-b border-border py-3">
            <label className="section-label block mb-2">{t("thoughtDetail.author")}</label>
            <input
              id="author"
              type="text"
              value={author}
              onChange={(e) => setAuthor(e.target.value)}
              placeholder={t("thoughtDetail.authorPlaceholder")}
              className="w-full bg-transparent border-none focus:ring-0 text-base py-1"
              maxLength={64}
              required
            />
          </div>
          <div className="border-b border-border py-3">
            <label className="section-label block mb-2">{t("thoughtDetail.comment")}</label>
            <textarea
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder={t("thoughtDetail.commentPlaceholder")}
              rows={3}
              className="w-full bg-transparent border-none focus:ring-0 text-base resize-none py-1"
              maxLength={2000}
              required
            />
          </div>
          <button
            type="submit"
            disabled={submitting}
            className="button-primary disabled:opacity-50"
          >
            {submitting ? t("thoughtDetail.submitting") : t("thoughtDetail.submit")}
          </button>
        </form>
      </section>
    </article>
  );
}
