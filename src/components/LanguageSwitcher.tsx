"use client";

import { useState, useRef, useEffect } from "react";
import { useLocale } from "@/contexts/LocaleContext";
import { languageSwitcherUiEn } from "@/lib/translations";

export function LanguageSwitcher() {
  const { locale, setLocale } = useLocale();
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
        className="nav-link flex items-center gap-1"
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-label={languageSwitcherUiEn.button}
      >
        <span>{languageSwitcherUiEn.button}</span>
        <span className="text-[10px]">▾</span>
      </button>
      {open && (
        <ul
          role="listbox"
          className="dropdown-panel absolute right-0 top-full mt-2 min-w-[7rem] py-1 z-50"
        >
          {(["zh", "en", "fr"] as const).map((loc) => (
            <li key={loc} role="option" aria-selected={locale === loc}>
              <button
                type="button"
                onClick={() => {
                  setLocale(loc);
                  setOpen(false);
                }}
                className={`w-full text-left px-4 py-2.5 nav-link ${
                  locale === loc ? "nav-link-active !text-fg" : ""
                }`}
              >
                {languageSwitcherUiEn.option[loc]}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
