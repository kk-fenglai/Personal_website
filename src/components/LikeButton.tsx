"use client";

import { useCallback, useEffect, useState } from "react";
import { useLocale } from "@/contexts/LocaleContext";

export type LikeTargetType = "thought" | "photo";

type LikeButtonProps = {
  targetType: LikeTargetType;
  targetId: string;
  initialCount?: number;
  initialLiked?: boolean;
  /** Skip initial fetch when parent already loaded stats */
  skipFetch?: boolean;
  variant?: "default" | "onDark";
  className?: string;
};

export function LikeButton({
  targetType,
  targetId,
  initialCount,
  initialLiked,
  skipFetch = false,
  variant = "default",
  className = "",
}: LikeButtonProps) {
  const { t } = useLocale();
  const [count, setCount] = useState(initialCount ?? 0);
  const [liked, setLiked] = useState(initialLiked ?? false);
  const [ready, setReady] = useState(skipFetch && initialCount !== undefined);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    if (skipFetch && initialCount !== undefined) {
      setCount(initialCount);
      setLiked(initialLiked ?? false);
      setReady(true);
      return;
    }
    let cancelled = false;
    const params = new URLSearchParams({
      targetType,
      ids: targetId,
    });
    fetch(`/api/likes?${params}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (cancelled || !data) return;
        setCount(data.counts?.[targetId] ?? 0);
        setLiked(Array.isArray(data.liked) && data.liked.includes(targetId));
        setReady(true);
      })
      .catch(() => {
        if (!cancelled) setReady(true);
      });
    return () => {
      cancelled = true;
    };
  }, [targetType, targetId, skipFetch, initialCount, initialLiked]);

  const toggle = useCallback(async () => {
    if (pending) return;
    setPending(true);
    const prevLiked = liked;
    const prevCount = count;
    const nextLiked = !liked;
    setLiked(nextLiked);
    setCount((c) => Math.max(0, c + (nextLiked ? 1 : -1)));

    try {
      const res = await fetch("/api/likes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetType, targetId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setCount(data.count);
      setLiked(data.liked);
    } catch {
      setLiked(prevLiked);
      setCount(prevCount);
    } finally {
      setPending(false);
    }
  }, [pending, liked, count, targetType, targetId]);

  const isDark = variant === "onDark";
  const label = liked ? t("like.unlike") : t("like.like");
  const countLabel = t("like.count").replace("{count}", String(count));

  return (
    <div
      className={`flex items-center gap-3 ${className}`}
      data-ready={ready ? "true" : "false"}
    >
      <button
        type="button"
        onClick={toggle}
        disabled={pending}
        aria-pressed={liked}
        aria-label={label}
        className={[
          "inline-flex items-center justify-center gap-2 min-h-[2.75rem] px-4 rounded-full border transition-all touch-manipulation",
          "disabled:opacity-50",
          isDark
            ? liked
              ? "border-warm/60 bg-warm/20 text-white"
              : "border-white/25 bg-white/10 text-white hover:bg-white/20"
            : liked
              ? "border-warm/50 bg-warm/10 text-warm"
              : "border-border bg-transparent text-muted hover:text-fg hover:border-fg/30",
        ].join(" ")}
      >
        <span className="text-lg leading-none" aria-hidden>
          {liked ? "♥" : "♡"}
        </span>
        <span className="section-label !text-[0.65rem]">
          {liked ? t("like.liked") : t("like.like")}
        </span>
      </button>
      <span
        className={
          isDark
            ? "type-caption !text-white/70 tabular-nums"
            : "type-caption tabular-nums"
        }
        aria-live="polite"
      >
        {countLabel}
      </span>
    </div>
  );
}
