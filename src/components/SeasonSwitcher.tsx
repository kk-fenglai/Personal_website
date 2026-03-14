"use client";

import { useState, useRef, useEffect } from "react";
import { useSeason } from "@/contexts/SeasonContext";
import { type Season, seasonLabels } from "@/contexts/SeasonContext";
import { useLocale } from "@/contexts/LocaleContext";

const SEASONS: Season[] = ["spring", "summer", "autumn", "winter"];

export function SeasonSwitcher() {
  const { season, setSeason } = useSeason();
  const { t } = useLocale();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1 text-base text-muted hover:text-fg transition-colors"
        aria-expanded={open}
        aria-label={t("nav.season")}
      >
        <span>{t("nav.season")}</span>
        <span className="text-xs">▾</span>
      </button>
      {open && (
        <ul
          role="listbox"
          className="absolute right-0 top-full mt-2 min-w-[6rem] py-1 rounded-lg border border-border bg-bg-card shadow-lg z-50"
        >
          {SEASONS.map((s) => (
            <li key={s} role="option" aria-selected={season === s}>
              <button
                type="button"
                onClick={() => {
                  setSeason(s);
                  setOpen(false);
                }}
                className={`w-full text-left px-4 py-2 text-base transition-colors ${
                  season === s ? "text-fg font-medium" : "text-muted hover:text-fg"
                }`}
              >
                {seasonLabels[s]}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
