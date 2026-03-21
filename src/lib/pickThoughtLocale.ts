import type { Locale } from "@/lib/translations";

/** 随想展示用：按界面语言选用译文，缺失则回退中文原文 */
export function pickThoughtTitle(
  thought: {
    title: string;
    titleEn?: string | null;
    titleFr?: string | null;
  },
  locale: Locale
): string {
  if (locale === "en" && thought.titleEn?.trim()) return thought.titleEn;
  if (locale === "fr" && thought.titleFr?.trim()) return thought.titleFr;
  return thought.title;
}

export function pickThoughtContent(
  thought: {
    content: string;
    contentEn?: string | null;
    contentFr?: string | null;
  },
  locale: Locale
): string {
  if (locale === "en" && thought.contentEn?.trim()) return thought.contentEn;
  if (locale === "fr" && thought.contentFr?.trim()) return thought.contentFr;
  return thought.content;
}

/** 当前是否正在显示自动翻译（用于显示小提示） */
export function isShowingMachineTranslation(
  thought: {
    title: string;
    titleEn?: string | null;
    titleFr?: string | null;
    content: string;
    contentEn?: string | null;
    contentFr?: string | null;
  },
  locale: Locale
): boolean {
  if (locale === "zh") return false;
  const t = pickThoughtTitle(thought, locale);
  const c = pickThoughtContent(thought, locale);
  return t !== thought.title || c !== thought.content;
}
