"use client";

import { Suspense } from "react";
import { ThoughtList } from "./ThoughtList";
import { useLocale } from "@/contexts/LocaleContext";

function ThoughtsHeader() {
  const { t } = useLocale();
  return (
    <header className="mb-16 md:mb-24">
      <p className="section-label mb-4 tracking-widest">{t("thoughts.streamLabel")}</p>
      <h1 className="type-display-lg text-fg">{t("thoughts.subtitle")}</h1>
      <p className="type-body-lg text-muted mt-6 reading">{t("thoughts.cardDesc")}</p>
      <div className="stitch-gold-line mt-8" />
    </header>
  );
}

export default function ThoughtsPage() {
  const { t } = useLocale();

  return (
    <div className="site-container mx-auto stitch-narrow pb-20">
      <ThoughtsHeader />
      <Suspense
        fallback={
          <div className="py-20 section-label text-muted">{t("thoughts.loading")}</div>
        }
      >
        <ThoughtList />
      </Suspense>
    </div>
  );
}
