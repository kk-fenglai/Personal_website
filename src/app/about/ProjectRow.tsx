"use client";

import { useState } from "react";
import { displayDomain, formatProjectNumber, pickLocalized } from "@/lib/aboutContent";
import type { ProjectView } from "@/lib/aboutStore";
import { useLocale } from "@/contexts/LocaleContext";

export function ProjectRow({ project, index }: { project: ProjectView; index: number }) {
  const { t, locale } = useLocale();
  const [imageFailed, setImageFailed] = useState(false);
  const name = pickLocalized(project.name, locale);
  const description = pickLocalized(project.description, locale);
  const showImage = project.imageUrl && !imageFailed;

  return (
    <a
      href={project.url}
      target="_blank"
      rel="noopener noreferrer"
      className="about-project"
    >
      <span className="about-project-num tabular-nums">{formatProjectNumber(index)}</span>
      <div className="about-project-thumb">
        {showImage && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={project.imageUrl!}
            alt=""
            loading="lazy"
            decoding="async"
            onError={() => setImageFailed(true)}
            // 图片可能在页面接管前就已加载失败，那时 onError 不会再触发
            ref={(img) => {
              if (img?.complete && img.naturalWidth === 0) setImageFailed(true);
            }}
          />
        )}
      </div>
      <div className="about-project-info">
        <h3 className="about-project-title type-headline-sm text-fg">{name}</h3>
        {description && <p className="text-muted reading mt-2">{description}</p>}
        <p className="about-project-domain mt-3">{displayDomain(project)}</p>
      </div>
      <div className="about-project-go">
        <span className="read-article-link">{t("about.projectVisit")} →</span>
      </div>
    </a>
  );
}
