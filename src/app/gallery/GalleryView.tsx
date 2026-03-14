"use client";

import { useEffect, useState } from "react";
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

  useEffect(() => {
    fetch("/api/photos")
      .then((res) => res.json())
      .then((data) => {
        setPhotos(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="py-20 text-muted tabular-nums">{t("gallery.loading")}</div>
    );
  }

  if (photos.length === 0) {
    return (
      <p className="py-20 text-muted">{t("gallery.empty")}</p>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3">
      {photos.map((p, i) => (
        <figure
          key={p.id}
          className="aspect-square relative rounded-lg overflow-hidden card group animate-in"
          style={{ animationDelay: `${0.04 * i}s`, opacity: 0 }}
        >
          <Image
            src={p.filename}
            alt={p.caption || t("gallery.photoAlt")}
            fill
            className="object-cover transition-transform duration-500 ease-out group-hover:scale-105"
            sizes="33vw"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
          {p.caption && (
            <figcaption className="absolute bottom-0 left-0 right-0 p-4 text-base text-white bg-gradient-to-t from-black/90 to-transparent">
              {p.caption}
            </figcaption>
          )}
        </figure>
      ))}
    </div>
  );
}
