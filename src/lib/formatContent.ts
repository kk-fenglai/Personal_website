/**
 * 解析随想内容中的加粗语法：**文字** 或 __文字__ 会渲染为粗体。
 * 仅做安全的内联替换，不解析 HTML。
 */
export type Segment = { type: "text"; value: string } | { type: "bold"; value: string };

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
