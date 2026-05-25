"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { PhotoImage } from "@/components/PhotoImage";
import { ScrollReveal } from "@/components/ScrollReveal";
import { useLocale } from "@/contexts/LocaleContext";
import {
  STITCH_HERO_IMAGE,
  STITCH_HOME_GALLERY_IMAGES,
  plainTextExcerpt,
} from "@/lib/stitchPlaceholders";
import {
  pickThoughtContent,
  pickThoughtTitle,
} from "@/lib/pickThoughtLocale";

type ThoughtPreview = {
  id: string;
  title: string;
  content: string;
  titleEn?: string | null;
  titleFr?: string | null;
  contentEn?: string | null;
  contentFr?: string | null;
  createdAt: string;
};

type PhotoPreview = {
  id: string;
  filename: string;
  caption: string | null;
};

type SiteImagesResponse = {
  home_hero: PhotoPreview | null;
  about_portrait: PhotoPreview | null;
  home_preview: (PhotoPreview | null)[];
};

const EMPTY_SITE_IMAGES: SiteImagesResponse = {
  home_hero: null,
  about_portrait: null,
  home_preview: [null, null, null, null, null],
};

function parseSiteImages(data: unknown): SiteImagesResponse {
  if (data && typeof data === "object" && Array.isArray((data as SiteImagesResponse).home_preview)) {
    return data as SiteImagesResponse;
  }
  return EMPTY_SITE_IMAGES;
}

export default function Home() {
  const { t, locale, dateLocale } = useLocale();
  const [thoughts, setThoughts] = useState<ThoughtPreview[]>([]);
  const [photos, setPhotos] = useState<PhotoPreview[]>([]);
  /** null = 站点图尚未加载，避免先显示 Stitch 占位再闪成用户上传的图 */
  const [siteImages, setSiteImages] = useState<SiteImagesResponse | null>(null);

  useEffect(() => {
    Promise.all([
      fetch("/api/thoughts/home-featured").then((r) => r.json()),
      fetch("/api/photos").then((r) => r.json()),
      fetch("/api/site-images").then((r) => r.json()),
    ])
      .then(([tData, pData, sData]) => {
        setThoughts(Array.isArray(tData) ? tData : []);
        setPhotos(Array.isArray(pData) ? pData : []);
        setSiteImages(parseSiteImages(sData));
      })
      .catch(() => setSiteImages(EMPTY_SITE_IMAGES));
  }, []);

  const siteImagesReady = siteImages !== null;

  const heroImage = siteImagesReady
    ? (siteImages!.home_hero?.filename ?? STITCH_HERO_IMAGE)
    : null;

  const galleryTiles = !siteImagesReady
    ? null
    : (() => {
    const fromSlots = siteImages!.home_preview
      .map((p, i) =>
        p
          ? { id: p.id, filename: p.filename, caption: p.caption }
          : {
              id: `stitch-${i}`,
              filename: STITCH_HOME_GALLERY_IMAGES[i],
              caption: null,
            }
      )
      .slice(0, 5);
    const hasAnySlot = siteImages?.home_preview.some(Boolean);
    if (hasAnySlot && fromSlots) return fromSlots;
    if (photos.length > 0) return photos.slice(0, 5);
    return null;
  })();

  const previewCount = galleryTiles?.length ?? 5;
  const mosaicTiles =
    galleryTiles ??
    STITCH_HOME_GALLERY_IMAGES.map((src, i) => ({
      id: `s-${i}`,
      filename: src,
      caption: null,
    }));

  return (
    <>
      <section className="min-h-[85vh] flex flex-col justify-center site-container mx-auto mb-24 md:mb-40">
        <div className="asymmetric-grid">
          <div className="col-span-12 md:col-start-2 md:col-span-10 mb-12 md:mb-16">
            <ScrollReveal className="home-hero-frame image-hover-zoom">
              {siteImagesReady && heroImage ? (
                <PhotoImage
                  src={heroImage}
                  alt={t("home.subtitle")}
                  fill
                  className="object-cover"
                  priority
                  sizes="(max-width: 768px) 100vw, 80vw"
                />
              ) : (
                <div className="absolute inset-0 bg-surface" aria-hidden />
              )}
            </ScrollReveal>
          </div>
          <div className="col-span-12 md:col-start-3 md:col-span-8">
            <ScrollReveal delayMs={80}>
              <h1 className="type-display-lg text-fg mb-8">{t("home.subtitle")}</h1>
              <p className="type-body-lg text-muted max-w-2xl reading">
                {t("home.intro")}
                <br />
                <span className="italic">{t("home.quote")}</span>
              </p>
            </ScrollReveal>
          </div>
        </div>
      </section>

      <section className="site-container mx-auto mb-24 md:mb-40">
        <div className="editorial-section-header">
          <span className="section-label tracking-[0.2em]">01 · {t("home.cardThoughts")}</span>
          <Link href="/thoughts" className="nav-link text-underline-expand">
            {t("home.ctaThoughts")} →
          </Link>
        </div>
        <div className="asymmetric-grid">
          {(thoughts.length > 0
            ? thoughts
            : [
                {
                  id: "placeholder-1",
                  title: t("home.cardThoughts"),
                  content: t("home.cardThoughtsDesc"),
                  createdAt: new Date().toISOString(),
                },
              ]
          ).map((item, i) => (
            <ScrollReveal
              key={item.id}
              delayMs={i * 100}
              className="col-span-12 md:col-span-4"
            >
              <Link href={item.id.startsWith("placeholder") ? "/thoughts" : `/thoughts/${item.id}`} className="block py-10 group border-b border-border md:border-0">
                <span className="section-label text-tertiary block mb-6 tabular-nums">
                  {new Date(item.createdAt).toLocaleDateString(dateLocale)}
                </span>
                <h3 className="type-headline-md text-fg mb-6 group-hover:text-warm transition-colors">
                  {pickThoughtTitle(item, locale) ?? item.title}
                </h3>
                <p className="text-muted reading mb-8 line-clamp-3">
                  {plainTextExcerpt(pickThoughtContent(item, locale) ?? item.content, 120)}
                </p>
                <span className="read-article-link">{t("common.readMore")}</span>
              </Link>
            </ScrollReveal>
          ))}
        </div>
      </section>

      <section className="site-container mx-auto mb-24 md:mb-40">
        <div className="editorial-section-header">
          <span className="section-label tracking-[0.2em]">02 · {t("home.cardGallery")}</span>
          <Link href="/gallery" className="nav-link text-underline-expand">
            {t("home.ctaGallery")} →
          </Link>
        </div>
        <div
          className={
            previewCount >= 3
              ? "home-gallery-mosaic"
              : "home-gallery-mosaic home-gallery-mosaic-few"
          }
        >
          {(siteImagesReady ? mosaicTiles : Array.from({ length: 5 }, (_, i) => ({ id: `sk-${i}`, filename: "", caption: null })))
            .slice(0, 5)
            .map((p, i) => (
              <div
                key={p.id}
                className={`home-gallery-tile home-gallery-tile-${i} image-hover-zoom animate-in`}
                style={{ animationDelay: `${0.06 * i}s`, opacity: 0 }}
              >
                <Link href="/gallery" className="home-gallery-tile-link">
                  {p.filename ? (
                    <PhotoImage
                      src={p.filename}
                      alt={p.caption || t("gallery.photoAlt")}
                      fill
                      className="object-cover"
                      sizes={
                        i === 0
                          ? "(max-width: 768px) 100vw, 66vw"
                          : "(max-width: 768px) 100vw, 33vw"
                      }
                    />
                  ) : (
                    <div className="absolute inset-0 bg-surface-container" aria-hidden />
                  )}
                </Link>
              </div>
            ))}
        </div>
      </section>

      <section className="surface-band py-24 md:py-32 mb-16">
        <div className="site-container mx-auto asymmetric-grid">
          <ScrollReveal className="col-span-12 md:col-start-2 md:col-span-4">
            <span className="section-label block mb-4 tracking-[0.2em]">03 · {t("home.aboutTitle")}</span>
            <h2 className="type-headline-md text-fg mb-6">{t("home.aboutText")}</h2>
            <p className="text-muted reading">{t("home.quote")}</p>
          </ScrollReveal>
          <ScrollReveal delayMs={100} className="col-span-12 md:col-start-7 md:col-span-5 flex items-center">
            <Link href="/about" className="read-article-link text-lg">
              {t("about.learnMore")} →
            </Link>
          </ScrollReveal>
        </div>
      </section>
    </>
  );
}
