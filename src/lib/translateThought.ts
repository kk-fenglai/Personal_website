/**
 * 使用 [LibreTranslate](https://github.com/LibreTranslate/LibreTranslate) HTTP API
 * 将中文标题与正文翻译为英文、法文。
 *
 * 环境变量：
 * - `LIBRETRANSLATE_URL`：实例地址，默认 `https://libretranslate.com`（公共实例有频率限制，生产建议自建）
 * - `LIBRETRANSLATE_API_KEY`：若你的实例要求 API Key，则填写
 * - `LIBRETRANSLATE_DISABLED=true`：关闭自动翻译（返回 null）
 */
const DEFAULT_BASE = "https://libretranslate.com";
/** 单次请求大致上限，过长则分段翻译再拼接 */
const CHUNK_SOFT_MAX = 2800;

export type ThoughtTranslations = {
  titleEn: string;
  contentEn: string;
  titleFr: string;
  contentFr: string;
};

function getBaseUrl(): string {
  const raw = process.env.LIBRETRANSLATE_URL?.trim();
  if (raw) return raw.replace(/\/$/, "");
  return DEFAULT_BASE;
}

function splitForTranslate(text: string): string[] {
  if (text.length <= CHUNK_SOFT_MAX) return [text];
  const chunks: string[] = [];
  let start = 0;
  while (start < text.length) {
    let end = Math.min(start + CHUNK_SOFT_MAX, text.length);
    if (end < text.length) {
      const slice = text.slice(start, end);
      const nl = slice.lastIndexOf("\n");
      if (nl > CHUNK_SOFT_MAX * 0.4) end = start + nl + 1;
    }
    chunks.push(text.slice(start, end));
    start = end;
  }
  return chunks;
}

async function libreTranslateOne(
  text: string,
  target: "en" | "fr",
  baseUrl: string,
  apiKey?: string
): Promise<string> {
  const trimmed = text;
  if (!trimmed) return "";

  const url = `${baseUrl}/translate`;
  const body: Record<string, string> = {
    q: trimmed,
    source: "zh",
    target,
    format: "text",
  };
  if (apiKey) body.api_key = apiKey;

  const res = await fetch(url, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`LibreTranslate HTTP ${res.status}: ${errText.slice(0, 500)}`);
  }

  const data = (await res.json()) as { translatedText?: string; error?: string };
  if (data.error) {
    throw new Error(`LibreTranslate: ${data.error}`);
  }
  if (typeof data.translatedText !== "string") {
    throw new Error("LibreTranslate: missing translatedText");
  }
  return data.translatedText;
}

async function translateTextChunks(
  text: string,
  target: "en" | "fr",
  baseUrl: string,
  apiKey?: string
): Promise<string> {
  const parts = splitForTranslate(text);
  const out: string[] = [];
  for (const chunk of parts) {
    out.push(await libreTranslateOne(chunk, target, baseUrl, apiKey));
  }
  return out.join("");
}

/**
 * 将一条随想的标题与正文翻译为英、法。
 * 设置 `LIBRETRANSLATE_DISABLED=true` 时返回 null。
 */
export async function translateThoughtZhToEnFr(
  title: string,
  content: string
): Promise<ThoughtTranslations | null> {
  if (process.env.LIBRETRANSLATE_DISABLED?.toLowerCase() === "true") {
    return null;
  }

  const baseUrl = getBaseUrl();
  const apiKey = process.env.LIBRETRANSLATE_API_KEY?.trim();

  // 串行请求，减轻公共实例限频（429）
  const titleEn = await translateTextChunks(title, "en", baseUrl, apiKey);
  const contentEn = await translateTextChunks(content, "en", baseUrl, apiKey);
  const titleFr = await translateTextChunks(title, "fr", baseUrl, apiKey);
  const contentFr = await translateTextChunks(content, "fr", baseUrl, apiKey);

  return { titleEn, contentEn, titleFr, contentFr };
}
