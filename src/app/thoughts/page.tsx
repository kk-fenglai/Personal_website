"use client";

import { ThoughtList } from "./ThoughtList";
import { useLocale } from "@/contexts/LocaleContext";

export default function ThoughtsPage() {
  const { t } = useLocale();

  return (
    <div className="space-y-8">
      <header>
        <p className="section-label mb-1">{t("thoughts.title")}</p>
        <h1 className="text-2xl sm:text-3xl font-bold text-fg">
          {t("thoughts.subtitle")}
        </h1>
      </header>
      <ThoughtList />
    </div>
  );
}
