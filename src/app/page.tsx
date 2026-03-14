"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useLocale } from "@/contexts/LocaleContext";
import { useSeason } from "@/contexts/SeasonContext";
import { FallingSnow } from "@/components/FallingSnow";
import { FallingPetals } from "@/components/FallingPetals";
import { FallingLeaves } from "@/components/FallingLeaves";
import { FallingRain } from "@/components/FallingRain";

export default function Home() {
  const { t } = useLocale();
  const { season } = useSeason();
  const [stats, setStats] = useState({ thoughts: 0, photos: 0 });

  useEffect(() => {
    fetch("/api/stats")
      .then((r) => r.json())
      .then((data) => setStats({ thoughts: data.thoughts ?? 0, photos: data.photos ?? 0 }))
      .catch(() => {});
  }, []);

  return (
    <>
      <div className="bg-warm-glow" aria-hidden />
      {season === "winter" && <FallingSnow />}
      {season === "spring" && <FallingPetals />}
      {season === "summer" && <FallingRain />}
      {season === "autumn" && <FallingLeaves />}
      <div className="relative z-10 space-y-20">
        <section className="pt-6 pb-12 animate-in animate-in-1">
          <p className="section-label mb-3">{t("home.title")}</p>
          <h1 className="text-3xl sm:text-4xl md:text-[2.25rem] font-bold text-fg tracking-tight">
            {t("home.subtitle")}
          </h1>
          <p className="mt-6 text-muted max-w-xl reading text-[1.05rem]">
            {t("home.intro")}
          </p>
          <p className="mt-8 text-muted/90 text-base sm:text-lg italic max-w-lg leading-relaxed">
            {t("home.quote")}
          </p>
        </section>

        <section className="grid sm:grid-cols-2 gap-4">
          <Link href="/thoughts" className="card p-6 block animate-in animate-in-2">
          <span className="section-label">01</span>
          <h2 className="mt-2 text-xl sm:text-[1.35rem] font-semibold text-fg">
            {t("home.cardThoughts")}
          </h2>
          <p className="mt-2 text-muted text-base reading">
            {t("home.cardThoughtsDesc")}
          </p>
          <p className="mt-4 text-base text-muted tabular-nums">
            {stats.thoughts ?? 0} {t("home.statsThoughts")} · {t("home.ctaThoughts")} →
          </p>
        </Link>
        <Link href="/gallery" className="card p-6 block animate-in animate-in-3">
          <span className="section-label">02</span>
          <h2 className="mt-2 text-xl sm:text-[1.35rem] font-semibold text-fg">
            {t("home.cardGallery")}
          </h2>
          <p className="mt-2 text-muted text-base reading">
            {t("home.cardGalleryDesc")}
          </p>
          <p className="mt-4 text-base text-muted tabular-nums">
            {stats.photos ?? 0} {t("home.statsPhotos")} · {t("home.ctaGallery")} →
          </p>
        </Link>
      </section>

      <section className="card p-6 sm:p-8 animate-in animate-in-4">
        <p className="section-label">03 · {t("home.aboutTitle")}</p>
        <p className="mt-5 text-muted text-base reading">
          {t("home.aboutText")}
        </p>
      </section>
      </div>
    </>
  );
}
