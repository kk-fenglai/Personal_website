"use client";

import { useLocale } from "@/contexts/LocaleContext";
import { languageSwitcherUiEn } from "@/lib/translations";

const LOCALES = ["zh", "en", "fr"] as const;

export function InlineLanguageSwitcher() {
  const { locale, setLocale } = useLocale();

  return (
    <div
      className="flex items-center gap-2 sm:gap-3 md:mr-2 md:pr-4 md:border-r md:border-border"
      role="group"
      aria-label={languageSwitcherUiEn.button}
    >
      {LOCALES.map((loc, i) => (
        <span key={loc} className="flex items-center gap-3">
          {i > 0 && <span className="text-border text-[10px]">/</span>}
          <button
            type="button"
            onClick={() => setLocale(loc)}
            className={
              locale === loc
                ? "nav-link nav-link-active !text-fg"
                : "nav-link opacity-60 hover:opacity-100"
            }
          >
            {languageSwitcherUiEn.option[loc]}
          </button>
        </span>
      ))}
    </div>
  );
}
