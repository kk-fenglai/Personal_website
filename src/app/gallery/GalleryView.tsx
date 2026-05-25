"use client";

import { useEffect, useState, useCallback } from "react";
import { createPortal } from "react-dom";
import { PhotoImage } from "@/components/PhotoImage";
import { ScrollReveal } from "@/components/ScrollReveal";
import { useLocale } from "@/contexts/LocaleContext";
import { GALLERY_LAYOUT_CYCLE, type GalleryLayoutSpec } from "@/lib/stitchPlaceholders";

type Photo = {
  id: string;
  filename: string;
  caption: string | null;
  isPublic: boolean;
  createdAt: string;
};

function layoutForIndex(i: number): GalleryLayoutSpec {
  return GALLERY_LAYOUT_CYCLE[i % GALLERY_LAYOUT_CYCLE.length];
}

export function GalleryView() {
  const { t, dateLocale } = useLocale();
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  useEffect(() => {
    fetch("/api/photos")
      .then((res) => res.json())
      .then((data) => {
        setPhotos(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const openLightbox = useCallback((index: number) => setLightboxIndex(index), []);
  const closeLightbox = useCallback(() => setLightboxIndex(null), []);

  const goPrev = useCallback(() => {
    if (lightboxIndex === null) return;
    setLightboxIndex(lightboxIndex === 0 ? photos.length - 1 : lightboxIndex - 1);
  }, [lightboxIndex, photos.length]);

  const goNext = useCallback(() => {
    if (lightboxIndex === null) return;
    setLightboxIndex(lightboxIndex === photos.length - 1 ? 0 : lightboxIndex + 1);
  }, [lightboxIndex, photos.length]);

  useEffect(() => {
    if (lightboxIndex === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeLightbox();
      if (e.key === "ArrowLeft") goPrev();
      if (e.key === "ArrowRight") goNext();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [lightboxIndex, closeLightbox, goPrev, goNext]);

  useEffect(() => {
    if (lightboxIndex === null) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [lightboxIndex]);

  if (loading) {
    return (
      <div className="site-container mx-auto py-20 flex flex-col items-center gap-4 text-muted">
        <div className="w-10 h-10 border-2 border-current border-t-transparent animate-spin" />
        <span className="tabular-nums">{t("gallery.loading")}</span>
      </div>
    );
  }

  if (photos.length === 0) {
    return (
      <div className="site-container mx-auto py-20 text-center">
        <p className="text-muted text-lg mb-2">{t("gallery.empty")}</p>
        <p className="text-muted/80 text-base">{t("gallery.emptyHint")}</p>
      </div>
    );
  }

  const current = lightboxIndex !== null ? photos[lightboxIndex] : null;

  return (
    <>
      <section className="site-container mx-auto asymmetric-grid">
        {photos.map((p, i) => {
          const layout = layoutForIndex(i);
          const dateLabel = new Date(p.createdAt).toLocaleDateString(dateLocale, {
            year: "numeric",
            month: "short",
          });

          return (
            <ScrollReveal
              key={p.id}
              delayMs={(i % 5) * 60}
              className={`${layout.cols} mb-12 md:mb-16 relative group cursor-pointer ${
                layout.offset ? "md:mt-[var(--asymmetric-offset)]" : ""
              }`}
            >
              <button
                type="button"
                onClick={() => openLightbox(i)}
                className="w-full text-left"
              >
                <div
                  className={`overflow-hidden bg-surface relative image-hover-zoom ${layout.aspect} ${
                    layout.bordered ? "border border-border p-2" : ""
                  }`}
                >
                  <PhotoImage
                    src={p.filename}
                    alt={p.caption || t("gallery.photoAlt")}
                    fill
                    className="object-cover transition-transform duration-700"
                    sizes="(max-width: 768px) 100vw, 50vw"
                  />
                  {layout.overlay && (
                    <div className="gallery-item-overlay text-white">
                      <div>
                        <p className="section-label !text-white/90 mb-2">{dateLabel}</p>
                        {p.caption && (
                          <h3 className="type-headline-sm !text-white">{p.caption}</h3>
                        )}
                      </div>
                    </div>
                  )}
                </div>
                {layout.captionBelow && (
                  <div className="mt-4">
                    <p className="section-label">{dateLabel}</p>
                    {p.caption && (
                      <h3 className="type-headline-sm text-fg mt-1">{p.caption}</h3>
                    )}
                  </div>
                )}
              </button>
            </ScrollReveal>
          );
        })}
      </section>

      {current &&
        lightboxIndex !== null &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            role="dialog"
            aria-modal="true"
            aria-label={t("gallery.viewFullScreen")}
            className="fixed inset-0 z-[9999] flex flex-col bg-black"
            onClick={(e) => e.target === e.currentTarget && closeLightbox()}
          >
            <div className="absolute top-4 right-4 z-10 flex items-center gap-2">
              <a
                href={current.filename}
                download={current.filename.split("/").pop() || "photo.jpg"}
                className="w-10 h-10 bg-white/10 text-white hover:bg-white/20 flex items-center justify-center text-lg transition-colors"
                aria-label={t("gallery.download")}
              >
                ↓
              </a>
              <button
                type="button"
                onClick={closeLightbox}
                className="w-10 h-10 bg-white/10 text-white hover:bg-white/20 flex items-center justify-center text-xl transition-colors"
                aria-label={t("gallery.close")}
              >
                ×
              </button>
            </div>

            <div className="flex-1 flex items-center justify-center p-4 min-h-0">
              <div
                className="relative w-full h-full max-w-5xl max-h-[85vh]"
                onClick={(e) => e.stopPropagation()}
              >
                <PhotoImage
                  src={current.filename}
                  alt={current.caption || t("gallery.photoAlt")}
                  fill
                  className="object-contain"
                  sizes="100vw"
                  priority
                />
              </div>
            </div>

            {photos.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={goPrev}
                  className="absolute left-4 top-1/2 -translate-y-1/2 z-10 w-12 h-12 bg-white/10 text-white hover:bg-white/20 text-2xl"
                  aria-label={t("gallery.prev")}
                >
                  ‹
                </button>
                <button
                  type="button"
                  onClick={goNext}
                  className="absolute right-4 top-1/2 -translate-y-1/2 z-10 w-12 h-12 bg-white/10 text-white hover:bg-white/20 text-2xl"
                  aria-label={t("gallery.next")}
                >
                  ›
                </button>
              </>
            )}

            <div className="p-4 text-center text-white/90 shrink-0">
              {current.caption && (
                <p className="text-base sm:text-lg mb-1 max-w-2xl mx-auto">{current.caption}</p>
              )}
              <p className="text-sm text-white/60">
                {t("gallery.photoCount")
                  .replace("{current}", String(lightboxIndex + 1))
                  .replace("{total}", String(photos.length))}
              </p>
            </div>
          </div>,
          document.body
        )}
    </>
  );
}
