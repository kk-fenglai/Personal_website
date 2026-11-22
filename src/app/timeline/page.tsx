"use client";

import { useLocale } from "@/contexts/LocaleContext";
import { TimelineView } from "./TimelineView";

export default function TimelinePage() {
  const { t } = useLocale();

  return (
    <div className="timeline-page site-container mx-auto pb-20">
      <header className="mb-12 md:mb-16">
        <p className="section-label mb-4 tracking-widest">Timeline</p>
        <h1 className="type-display-lg text-fg">{t("timeline.title")}</h1>
        <p className="type-body-lg text-muted mt-6 reading">{t("timeline.lead")}</p>
      </header>
      <TimelineView />
    </div>
  );
}
