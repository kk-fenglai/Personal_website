"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { PhotoImage } from "@/components/PhotoImage";
import { ScrollReveal } from "@/components/ScrollReveal";
import { useLocale } from "@/contexts/LocaleContext";
import { STITCH_ABOUT_PORTRAIT } from "@/lib/stitchPlaceholders";

const VALUE_KEYS = [
  { num: "01", titleKey: "about.value1Title", descKey: "about.value1Desc" },
  { num: "02", titleKey: "about.value2Title", descKey: "about.value2Desc" },
  { num: "03", titleKey: "about.value3Title", descKey: "about.value3Desc" },
  { num: "04", titleKey: "about.value4Title", descKey: "about.value4Desc" },
] as const;

export default function AboutPage() {
  const { t } = useLocale();
  const [portraitSrc, setPortraitSrc] = useState(STITCH_ABOUT_PORTRAIT);

  useEffect(() => {
    fetch("/api/site-images")
      .then((r) => r.json())
      .then((data) => {
        if (data?.about_portrait?.filename) {
          setPortraitSrc(data.about_portrait.filename);
        }
      })
      .catch(() => {});
  }, []);

  return (
    <div className="pb-16">
      <section className="site-container mx-auto mb-24 md:mb-40">
        <div className="asymmetric-grid items-start">
          <ScrollReveal className="col-span-12 md:col-span-6 image-hover-zoom relative min-h-[min(70vh,700px)]">
            <PhotoImage
              src={portraitSrc}
              alt={t("about.portraitAlt")}
              fill
              className="object-cover grayscale hover:grayscale-0 transition-all duration-700"
              sizes="(max-width: 768px) 100vw, 50vw"
              priority
            />
          </ScrollReveal>
          <div className="col-span-12 md:col-span-5 md:col-start-8 mt-10 md:mt-24">
            <ScrollReveal delayMs={120}>
              <span className="section-label block mb-6 tracking-widest">{t("about.stationLabel")}</span>
              <h1 className="type-display-lg text-fg mb-10 md:mb-12 leading-tight">
                {t("about.title")}
              </h1>
              <div className="space-y-8 type-body-lg text-muted reading">
                <p>{t("about.intro1")}</p>
                <p>{t("about.intro2")}</p>
                <div className="pt-8 border-t border-border flex flex-wrap gap-12">
                  <div>
                    <span className="section-label block mb-1 !text-fg">{t("about.establishedLabel")}</span>
                    <span className="type-headline-sm text-fg">{t("about.established")}</span>
                  </div>
                  <div>
                    <span className="section-label block mb-1 !text-fg">{t("about.themeLabel")}</span>
                    <span className="type-headline-sm text-fg">{t("about.theme")}</span>
                  </div>
                </div>
              </div>
            </ScrollReveal>
          </div>
        </div>
      </section>

      <section className="surface-band py-20 md:py-32 mb-24 md:mb-40">
        <div className="site-container mx-auto asymmetric-grid">
          <ScrollReveal className="col-span-12 md:col-span-4">
            <h2 className="type-headline-md text-fg mb-6">{t("about.valuesHeading")}</h2>
            <p className="text-muted reading">{t("about.valuesLead")}</p>
          </ScrollReveal>
          <div className="col-span-12 md:col-span-7 md:col-start-6 grid grid-cols-1 sm:grid-cols-2 gap-10 md:gap-12">
            {VALUE_KEYS.map((item, i) => (
              <ScrollReveal key={item.num} delayMs={80 * (i + 1)}>
                <span className="type-headline-sm text-warm block mb-3">{item.num}. {t(item.titleKey)}</span>
                <p className="text-muted reading">{t(item.descKey)}</p>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      <section className="site-container mx-auto">
        <div className="asymmetric-grid">
          <ScrollReveal className="col-span-12 md:col-span-5">
            <h2 className="type-display-lg text-fg mb-6 leading-tight">{t("about.contactHeading")}</h2>
            <p className="type-body-lg text-muted reading mb-10">{t("about.contactLead")}</p>
            <div>
              <span className="section-label block mb-2">{t("about.emailLabel")}</span>
              <a
                href={`mailto:${t("about.email")}`}
                className="type-headline-sm text-fg hover:text-warm transition-colors"
              >
                {t("about.email")}
              </a>
            </div>
          </ScrollReveal>
          <ScrollReveal delayMs={150} className="col-span-12 md:col-span-6 md:col-start-7 mt-12 md:mt-0">
            <div className="space-y-8">
              <p className="text-muted reading">{t("about.contactNote")}</p>
              <div className="flex flex-wrap gap-4">
                <Link href="/thoughts" className="button-primary">
                  {t("home.ctaThoughts")}
                </Link>
                <Link href="/gallery" className="button-secondary">
                  {t("home.ctaGallery")}
                </Link>
              </div>
              <p className="type-caption">
                {t("about.accessHint")}{" "}
                <Link href="/verify" className="text-warm hover:opacity-80 underline-offset-2 hover:underline">
                  {t("about.accessLink")}
                </Link>
              </p>
            </div>
          </ScrollReveal>
        </div>
      </section>
    </div>
  );
}
