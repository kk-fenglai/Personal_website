/**
 * 解析随想内容中的加粗语法：**文字** 或 __文字__ 会渲染为粗体。
 * 支持 Markdown 图片：![说明](/uploads/xxx.jpg)（由后台插入，仅渲染安全 URL）。
 */
export type Segment = { type: "text"; value: string } | { type: "bold"; value: string };

/** 仅允许站内路径或 http(s)，防止 javascript: 等 */
export function sanitizeImageUrl(raw: string): string | null {
  const u = raw.trim();
  if (!u) return null;
  if (/^javascript:/i.test(u) || /^data:/i.test(u) || /^vbscript:/i.test(u)) {
    return null;
  }
  if (u.startsWith("/")) return u;
  if (/^https?:\/\//i.test(u)) return u;
  return null;
}

export type ContentBlock =
  | { type: "text"; segments: Segment[] }
  | { type: "image"; alt: string; url: string };

/**
 * 将正文拆成「文本块（含加粗）」与「图片块」，按出现顺序。
 */
export function parseThoughtContent(content: string): ContentBlock[] {
  if (!content) {
    return [{ type: "text", segments: parseBold("") }];
  }
  const re = /!\[([^\]]*)\]\(([^)]+)\)/g;
  const blocks: ContentBlock[] = [];
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(content)) !== null) {
    if (m.index > last) {
      blocks.push({
        type: "text",
        segments: parseBold(content.slice(last, m.index)),
      });
    }
    const url = sanitizeImageUrl(m[2]);
    if (url) {
      blocks.push({
        type: "image",
        alt: (m[1] || "图片").slice(0, 200),
        url,
      });
    } else {
      blocks.push({
        type: "text",
        segments: [{ type: "text", value: m[0] }],
      });
    }
    last = re.lastIndex;
  }
  if (last < content.length) {
    blocks.push({
      type: "text",
      segments: parseBold(content.slice(last)),
    });
  }
  return blocks.length ? blocks : [{ type: "text", segments: parseBold(content) }];
}

export function parseBold(content: string): Segment[] {
  if (!content) return [{ type: "text", value: "" }];
  const result: Segment[] = [];
  // 匹配 **...** 或 __...__（非贪婪），内容可含换行
  const re = /\*\*([\s\S]+?)\*\*|__([\s\S]+?)__/g;
  let lastEnd = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(content)) !== null) {
    if (m.index > lastEnd) {
      result.push({ type: "text", value: content.slice(lastEnd, m.index) });
    }
    const boldText = m[1] ?? m[2] ?? "";
    result.push({ type: "bold", value: boldText });
    lastEnd = re.lastIndex;
  }
  if (lastEnd < content.length) {
    result.push({ type: "text", value: content.slice(lastEnd) });
  }
  return result.length ? result : [{ type: "text", value: content }];
}
