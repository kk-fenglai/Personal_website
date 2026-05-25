"use client";

import { GalleryView } from "./GalleryView";
import { useLocale } from "@/contexts/LocaleContext";

export default function GalleryPage() {
  const { t } = useLocale();

  return (
    <div className="pb-24 md:pb-32">
      <header className="site-container mx-auto mb-16 md:mb-24 max-w-4xl">
        <span className="section-label mb-6 block tracking-widest">{t("gallery.visualArchive")}</span>
        <h1 className="type-display-lg text-fg leading-tight mb-8">{t("gallery.heroSubtitle")}</h1>
        <div className="stitch-gold-line" />
      </header>
      <GalleryView />
    </div>
  );
}
