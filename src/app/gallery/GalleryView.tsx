"use client";

import { useEffect, useState, useCallback } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import { useLocale } from "@/contexts/LocaleContext";

type Photo = {
  id: string;
  filename: string;
  caption: string | null;
  isPublic: boolean;
  createdAt: string;
};

export function GalleryView() {
  const { t } = useLocale();
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

  // 灯箱打开时锁定 body 滚动，避免背景露出横线/回到顶部
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
      <div className="py-20 flex flex-col items-center gap-4 text-muted">
        <div className="w-10 h-10 border-2 border-current border-t-transparent rounded-full animate-spin" />
        <span className="tabular-nums">{t("gallery.loading")}</span>
      </div>
    );
  }

  if (photos.length === 0) {
    return (
      <div className="py-20 text-center">
        <p className="text-muted text-lg mb-2">{t("gallery.empty")}</p>
        <p className="text-muted/80 text-base">{t("gallery.emptyHint")}</p>
      </div>
    );
  }

  const current = lightboxIndex !== null ? photos[lightboxIndex] : null;

  return (
    <>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-4">
        {photos.map((p, i) => (
          <button
            type="button"
            key={p.id}
            onClick={() => openLightbox(i)}
            className="aspect-square relative rounded-xl overflow-hidden bg-bg-card border border-border shadow-sm hover:shadow-md hover:border-warm/40 focus:outline-none focus:ring-2 focus:ring-warm/50 focus:ring-offset-2 focus:ring-offset-bg transition-all duration-300 group text-left animate-in"
            style={{ animationDelay: `${0.03 * i}s`, opacity: 0 }}
          >
            <Image
              src={p.filename}
              alt={p.caption || t("gallery.photoAlt")}
              fill
              className="object-cover transition-transform duration-500 ease-out group-hover:scale-105"
              sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, 25vw"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/0 to-black/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            {p.caption && (
              <span className="absolute bottom-0 left-0 right-0 p-3 text-sm text-white truncate block">
                {p.caption}
              </span>
            )}
            <span className="absolute top-2 right-2 w-8 h-8 rounded-full bg-black/40 flex items-center justify-center text-white/90 text-lg leading-none opacity-0 group-hover:opacity-100 transition-opacity">
              ⊕
            </span>
          </button>
        ))}
      </div>

      {/* Lightbox：用 Portal 挂到 body，避免被顶栏/底栏遮挡，并盖住整页消除横线 */}
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
                className="w-10 h-10 rounded-full bg-white/10 text-white hover:bg-white/20 flex items-center justify-center text-lg transition-colors"
                aria-label={t("gallery.download")}
                title={t("gallery.download")}
              >
                ↓
              </a>
              <button
                type="button"
                onClick={closeLightbox}
                className="w-10 h-10 rounded-full bg-white/10 text-white hover:bg-white/20 flex items-center justify-center text-xl transition-colors"
                aria-label={t("gallery.close")}
              >
                ×
              </button>
            </div>

            <div className="flex-1 flex items-center justify-center p-4 min-h-0">
              <div
                className="relative w-full h-full max-w-5xl max-h-[85vh] flex items-center justify-center"
                onClick={(e) => e.stopPropagation()}
              >
                <Image
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
                  className="absolute left-4 top-1/2 -translate-y-1/2 z-10 w-12 h-12 rounded-full bg-white/10 text-white hover:bg-white/20 flex items-center justify-center text-2xl transition-colors"
                  aria-label={t("gallery.prev")}
                >
                  ‹
                </button>
                <button
                  type="button"
                  onClick={goNext}
                  className="absolute right-4 top-1/2 -translate-y-1/2 z-10 w-12 h-12 rounded-full bg-white/10 text-white hover:bg-white/20 flex items-center justify-center text-2xl transition-colors"
                  aria-label={t("gallery.next")}
                >
                  ›
                </button>
              </>
            )}

            <div className="p-4 text-center text-white/90 shrink-0">
              {current.caption && (
                <p className="text-base sm:text-lg mb-1 max-w-2xl mx-auto">
                  {current.caption}
                </p>
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
