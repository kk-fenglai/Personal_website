"use client";

import { Fragment } from "react";
import { parseBold, parseThoughtContent } from "@/lib/formatContent";

type Props = {
  content: string;
  className?: string;
  /** 无图片时用作外层标签（有图片时固定为 div） */
  as?: "span" | "div" | "p";
  /** 为 true 时去掉图片 Markdown，仅保留文字与加粗（用于列表摘要等） */
  stripImages?: boolean;
};

/**
 * 渲染随想：**粗体**、![alt](url) 图片；其余为纯文本（保留换行）。
 */
export function FormattedContent({
  content,
  className = "",
  as: Tag = "span",
  stripImages = false,
}: Props) {
  if (stripImages) {
    const stripped = content.replace(/!\[[^\]]*\]\([^)]+\)/g, "").trim();
    const segments = parseBold(stripped);
    return (
      <Tag className={className}>
        {segments.map((seg, i) =>
          seg.type === "bold" ? (
            <strong key={i}>{seg.value}</strong>
          ) : (
            seg.value
          )
        )}
      </Tag>
    );
  }

  const blocks = parseThoughtContent(content);
  const hasImage = blocks.some((b) => b.type === "image");

  if (!hasImage) {
    const segments = blocks.flatMap((b) =>
      b.type === "text" ? b.segments : []
    );
    const flat = segments.length ? segments : parseBold(content);
    return (
      <Tag className={className}>
        {flat.map((seg, i) =>
          seg.type === "bold" ? (
            <strong key={i}>{seg.value}</strong>
          ) : (
            seg.value
          )
        )}
      </Tag>
    );
  }

  return (
    <div className={`space-y-4 ${className}`.trim()}>
      {blocks.map((block, i) =>
        block.type === "image" ? (
          <figure key={i} className="my-0">
            <img
              src={block.url}
              alt={block.alt}
              className="max-w-full rounded-lg border border-border/60 bg-bg-card/30"
              loading="lazy"
            />
            {block.alt && block.alt !== "图片" ? (
              <figcaption className="mt-2 text-sm text-muted text-center">{block.alt}</figcaption>
            ) : null}
          </figure>
        ) : (
          <p key={i} className="whitespace-pre-wrap reading m-0">
            {block.segments.map((seg, j) =>
              seg.type === "bold" ? (
                <strong key={j}>{seg.value}</strong>
              ) : (
                <Fragment key={j}>{seg.value}</Fragment>
              )
            )}
          </p>
        )
      )}
    </div>
  );
}
