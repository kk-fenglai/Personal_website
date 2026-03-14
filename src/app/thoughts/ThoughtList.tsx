"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useLocale } from "@/contexts/LocaleContext";

type Thought = {
  id: string;
  title: string;
  content: string;
  isPublic: boolean;
  createdAt: string;
  comments: { id: string }[];
};

export function ThoughtList() {
  const { t, dateLocale } = useLocale();
  const [thoughts, setThoughts] = useState<Thought[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/thoughts")
      .then((res) => res.json())
      .then((data) => {
        setThoughts(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
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

  return (
    <ul className="space-y-4">
      {thoughts.map((item, i) => (
        <li
          key={item.id}
          className="animate-in"
          style={{ animationDelay: `${0.06 * i}s`, opacity: 0 }}
        >
          <Link href={`/thoughts/${item.id}`} className="card p-6 block">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <h2 className="text-fg font-semibold">
                {item.title}
              </h2>
              <span className="text-muted text-base tabular-nums">
                {new Date(item.createdAt).toLocaleDateString(dateLocale)}
                {item.comments.length > 0 && ` · ${t("thoughts.commentsCount", { count: item.comments.length })}`}
              </span>
            </div>
            <p className="mt-2 text-muted text-base line-clamp-2 reading">
              {item.content}
            </p>
          </Link>
        </li>
      ))}
    </ul>
  );
}
