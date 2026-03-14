"use client";

import { GalleryView } from "./GalleryView";
import { useLocale } from "@/contexts/LocaleContext";

export default function GalleryPage() {
  const { t } = useLocale();

  return (
    <div className="space-y-8">
      <header>
        <p className="section-label mb-1">{t("gallery.title")}</p>
        <h1 className="text-2xl sm:text-3xl font-bold text-fg">
          {t("gallery.subtitle")}
        </h1>
      </header>
      <GalleryView />
    </div>
  );
}
