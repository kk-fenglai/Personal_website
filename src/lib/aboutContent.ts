import type { Locale } from "@/lib/translations";
import { isAllowedPhotoUrl } from "./photoUrl";

export type Localized = { zh: string; en: string | null; fr: string | null };

export const PROFILE_TEXT_FIELDS = [
  "headline",
  "intro",
  "fact1Label",
  "fact1Value",
  "fact2Label",
  "fact2Value",
  "collabTitle",
  "collabBody",
  "joinTitle",
  "joinBody",
] as const;
export type ProfileTextField = (typeof PROFILE_TEXT_FIELDS)[number];

export type ProfileInput = Record<ProfileTextField, string> & { email: string };
export type ProjectInput = {
  name: string;
  description: string;
  url: string;
  domain: string | null;
  imageUrl: string | null;
  isVisible: boolean;
};

export const DEFAULT_HEADLINE = "AI 极客创作者";
export const DEFAULT_EMAIL = "alzy1210@163.com";

export const LIMITS = {
  headline: 60,
  intro: 2000,
  factLabel: 20,
  factValue: 60,
  sectionTitle: 40,
  sectionBody: 600,
  email: 120,
  projectName: 60,
  projectDescription: 200,
  projectUrl: 500,
  projectDomain: 80,
} as const;

const PROFILE_FIELD_RULES: Record<ProfileTextField, { max: number; label: string }> = {
  headline: { max: LIMITS.headline, label: "大标题" },
  intro: { max: LIMITS.intro, label: "介绍" },
  fact1Label: { max: LIMITS.factLabel, label: "小信息一的标签" },
  fact1Value: { max: LIMITS.factValue, label: "小信息一的内容" },
  fact2Label: { max: LIMITS.factLabel, label: "小信息二的标签" },
  fact2Value: { max: LIMITS.factValue, label: "小信息二的内容" },
  collabTitle: { max: LIMITS.sectionTitle, label: "合作小标题" },
  collabBody: { max: LIMITS.sectionBody, label: "合作正文" },
  joinTitle: { max: LIMITS.sectionTitle, label: "加入小标题" },
  joinBody: { max: LIMITS.sectionBody, label: "加入正文" },
};

type Parsed<T> = { ok: true; value: T } | { ok: false; error: string };

function text(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function normalizeHttpUrl(raw: string): string | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  try {
    const parsed = new URL(trimmed);
    return parsed.protocol === "http:" || parsed.protocol === "https:" ? trimmed : null;
  } catch {
    return null;
  }
}

export function domainFromUrl(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "";
  }
}

export function displayDomain(p: { url: string; domain: string | null }): string {
  return p.domain?.trim() || domainFromUrl(p.url);
}

export function splitParagraphs(value: string): string[] {
  return value
    .split(/\n\s*\n/)
    .map((part) => part.trim())
    .filter(Boolean);
}

export function pickLocalized(v: Localized, locale: Locale): string {
  if (locale === "en" && v.en?.trim()) return v.en;
  if (locale === "fr" && v.fr?.trim()) return v.fr;
  return v.zh;
}

export function formatProjectNumber(index: number): string {
  return String(index + 1).padStart(2, "0");
}

export function parseProfileInput(body: unknown): Parsed<ProfileInput> {
  if (!isRecord(body)) return { ok: false, error: "提交的内容无效" };
  const value = { email: text(body.email) } as ProfileInput;
  for (const field of PROFILE_TEXT_FIELDS) {
    const rule = PROFILE_FIELD_RULES[field];
    value[field] = text(body[field]);
    if (value[field].length > rule.max) {
      return { ok: false, error: `${rule.label}不能超过 ${rule.max} 个字` };
    }
  }
  if (!value.headline) return { ok: false, error: "大标题不能为空" };
  if (!/^[^\s@]+@[^\s@]+$/.test(value.email) || value.email.length > LIMITS.email) {
    return { ok: false, error: "请填写有效的邮箱" };
  }
  return { ok: true, value };
}

export function parseProjectInput(body: unknown): Parsed<ProjectInput> {
  if (!isRecord(body)) return { ok: false, error: "提交的内容无效" };
  const name = text(body.name);
  const description = text(body.description);
  const domain = text(body.domain);
  const imageUrl = text(body.imageUrl);
  if (!name) return { ok: false, error: "项目名称不能为空" };
  if (name.length > LIMITS.projectName) {
    return { ok: false, error: `项目名称不能超过 ${LIMITS.projectName} 个字` };
  }
  if (description.length > LIMITS.projectDescription) {
    return { ok: false, error: `项目说明不能超过 ${LIMITS.projectDescription} 个字` };
  }
  const url = normalizeHttpUrl(text(body.url));
  if (!url || url.length > LIMITS.projectUrl) {
    return { ok: false, error: "链接必须以 http:// 或 https:// 开头" };
  }
  if (domain.length > LIMITS.projectDomain) {
    return { ok: false, error: `域名不能超过 ${LIMITS.projectDomain} 个字` };
  }
  if (imageUrl && !isAllowedPhotoUrl(imageUrl)) {
    return { ok: false, error: "配图地址无效，请重新上传" };
  }
  return {
    ok: true,
    value: {
      name,
      description,
      url,
      domain: domain || null,
      imageUrl: imageUrl || null,
      isVisible: body.isVisible !== false,
    },
  };
}
