/**
 * 分享卡片图（1200×630，四周留白 80）的排版：标题越长字号越小；
 * 标题行数多到放不下两行小字时，不显示小字。
 */
export function ogLayout(
  title: string,
  subtitle: string | null
): { titleSize: number; showSubtitle: boolean } {
  const hasSubtitle = Boolean(subtitle);
  if (title.length <= 10) return { titleSize: 96, showSubtitle: hasSubtitle };
  if (title.length <= 26) return { titleSize: 72, showSubtitle: hasSubtitle };
  return { titleSize: 52, showSubtitle: hasSubtitle && title.length <= 54 };
}
