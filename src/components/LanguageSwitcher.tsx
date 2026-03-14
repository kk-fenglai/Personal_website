"use client";

import { useState, useRef, useEffect } from "react";
import { useLocale } from "@/contexts/LocaleContext";
import { type Locale, localeLabels } from "@/lib/translations";

export function LanguageSwitcher() {
  const { locale, setLocale, t } = useLocale();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
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
        aria-haspopup="listbox"
        aria-label={t("nav.language")}
      >
        <span>{t("nav.language")}</span>
        <span className="text-xs">▾</span>
      </button>
      {open && (
        <ul
          role="listbox"
          className="absolute right-0 top-full mt-2 min-w-[7rem] py-1 rounded-lg border border-border bg-bg-card shadow-lg z-50"
        >
          {(["zh", "en"] as const).map((loc) => (
            <li key={loc} role="option" aria-selected={locale === loc}>
              <button
                type="button"
                onClick={() => {
                  setLocale(loc);
                  setOpen(false);
                }}
                className={`w-full text-left px-4 py-2 text-base transition-colors ${
                  locale === loc ? "text-fg font-medium" : "text-muted hover:text-fg"
                }`}
              >
                {localeLabels[loc]}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
