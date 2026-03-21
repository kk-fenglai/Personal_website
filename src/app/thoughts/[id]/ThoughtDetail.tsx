"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useLocale } from "@/contexts/LocaleContext";
import { FormattedContent } from "@/components/FormattedContent";
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
  createdAt: string;
  comments: Comment[];
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
      .then((res) => {
        if (res.status === 404 || res.status === 403) return null;
        return res.json();
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
      <div className="py-20 text-muted tabular-nums">{t("common.loading")}</div>
    );
  }

  if (!thought) {
    return (
      <div className="py-20 text-center">
        <p className="text-muted">{t("thoughtDetail.notFound")}</p>
        <Link href="/thoughts" className="mt-4 inline-block text-fg font-medium hover:opacity-80">
          {t("thoughtDetail.backToList")}
        </Link>
      </div>
    );
  }

  return (
    <article className="space-y-10">
      <Link href="/thoughts" className="text-muted text-sm hover:text-fg transition-colors">
        {t("thoughtDetail.back")}
      </Link>

      <header className="card p-5 sm:p-6">
        <h1 className="text-3xl sm:text-4xl font-bold text-fg">
          {pickThoughtTitle(thought, locale)}
        </h1>
        {isShowingMachineTranslation(thought, locale) && (
          <p className="mt-2 text-muted text-sm">{t("thoughts.machineTranslationNote")}</p>
        )}
        <time dateTime={thought.createdAt} className="block mt-3 text-muted text-base tabular-nums">
          {new Date(thought.createdAt).toLocaleString(dateLocale)}
        </time>
      </header>

      <div>
        <FormattedContent
          content={pickThoughtContent(thought, locale)}
          as="p"
          className="text-fg reading whitespace-pre-wrap"
        />
      </div>

      <section className="card p-5 sm:p-6">
        <h2 className="section-label mb-4">
          {t("thoughtDetail.comments")} ({thought.comments.length})
        </h2>
        <ul className="space-y-6">
          {thought.comments.map((c) => (
            <li key={c.id} className="border-b border-border pb-6 last:border-0">
              <div className="flex items-baseline gap-2 text-sm text-muted tabular-nums">
                <span className="font-medium text-fg">{c.author}</span>
                <time dateTime={c.createdAt}>
                  {new Date(c.createdAt).toLocaleString(dateLocale)}
                </time>
              </div>
              <p className="mt-2 text-fg text-base reading">{c.content}</p>
            </li>
          ))}
        </ul>

        <form onSubmit={handleSubmit} className="mt-8 space-y-4">
          {error && <p className="text-base text-red-400">{error}</p>}
          <div>
            <label className="block section-label mb-2">{t("thoughtDetail.author")}</label>
            <input
              id="author"
              type="text"
              value={author}
              onChange={(e) => setAuthor(e.target.value)}
              placeholder={t("thoughtDetail.authorPlaceholder")}
              className="w-full max-w-md rounded-lg border border-border bg-bg/50 px-4 py-2.5 text-fg placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-fg/30 focus:border-fg"
              maxLength={64}
              required
            />
          </div>
          <div>
            <label className="block section-label mb-2">{t("thoughtDetail.comment")}</label>
            <textarea
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder={t("thoughtDetail.commentPlaceholder")}
              rows={3}
              className="w-full rounded-lg border border-border bg-bg/50 px-4 py-2.5 text-fg placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-fg/30 focus:border-fg resize-none"
              maxLength={2000}
              required
            />
          </div>
          <button
            type="submit"
            disabled={submitting}
            className="rounded-lg bg-fg text-bg px-5 py-2.5 font-medium hover:opacity-90 disabled:opacity-50 transition-opacity"
          >
            {submitting ? t("thoughtDetail.submitting") : t("thoughtDetail.submit")}
          </button>
        </form>
      </section>
    </article>
  );
}
