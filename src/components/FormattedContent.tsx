"use client";

import { parseBold } from "@/lib/formatContent";

type Props = {
  content: string;
  className?: string;
  as?: "span" | "div" | "p";
};

/**
 * 渲染随想内容，将 **文字** 与 __文字__ 显示为粗体，其余为纯文本（保留换行）。
 */
export function FormattedContent({ content, className, as: Tag = "span" }: Props) {
  const segments = parseBold(content);
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
