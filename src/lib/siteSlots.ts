export const SITE_SLOT_HOME_HERO = "home_hero";
export const SITE_SLOT_ABOUT_PORTRAIT = "about_portrait";

export const SITE_SLOT_HOME_PREVIEW_PREFIX = "home_preview_";

export const SITE_SLOTS = [
  SITE_SLOT_HOME_HERO,
  SITE_SLOT_ABOUT_PORTRAIT,
  ...Array.from({ length: 5 }, (_, i) => `${SITE_SLOT_HOME_PREVIEW_PREFIX}${i}`),
] as const;

export type SiteSlot = (typeof SITE_SLOTS)[number];

export function isSiteSlot(value: unknown): value is SiteSlot {
  return typeof value === "string" && (SITE_SLOTS as readonly string[]).includes(value);
}

export function homePreviewSlot(index: number): SiteSlot {
  return `${SITE_SLOT_HOME_PREVIEW_PREFIX}${index}` as SiteSlot;
}
