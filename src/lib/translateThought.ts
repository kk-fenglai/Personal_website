/**
 * 使用 DeepL API 将中文标题与正文翻译为英文、法文。
 * 在 https://www.deepl.com/pro-api 申请免费版密钥（每月约 50 万字符），
 * 设置环境变量 DEEPL_AUTH_KEY（免费版密钥以 :fx 结尾）。
 */
const DEEPL_FREE = "https://api-free.deepl.com/v2/translate";
const DEEPL_PRO = "https://api.deepl.com/v2/translate";

async function deepLTranslateTwo(
  title: string,
  content: string,
  targetLang: "EN" | "FR",
  authKey: string
): Promise<[string, string]> {
  const useFree = authKey.endsWith(":fx");
  const url = useFree ? DEEPL_FREE : DEEPL_PRO;
  const body = new URLSearchParams();
  body.set("auth_key", authKey);
  body.append("text", title);
  body.append("text", content);
  body.set("target_lang", targetLang);
  body.set("source_lang", "ZH");

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`DeepL HTTP ${res.status}: ${errText.slice(0, 500)}`);
  }

  const data = (await res.json()) as {
    translations: { text: string }[];
  };
  const parts = data.translations.map((t) => t.text);
  if (parts.length < 2) {
    throw new Error("DeepL: unexpected response shape");
  }
  return [parts[0], parts[1]];
}

export type ThoughtTranslations = {
  titleEn: string;
  contentEn: string;
  titleFr: string;
  contentFr: string;
};

/**
 * 将一条随想的标题与正文翻译为英、法。未配置 DEEPL_AUTH_KEY 时返回 null（不抛错）。
 */
export async function translateThoughtZhToEnFr(
  title: string,
  content: string
): Promise<ThoughtTranslations | null> {
  const authKey = process.env.DEEPL_AUTH_KEY?.trim();
  if (!authKey) {
    return null;
  }

  const [titleEn, contentEn] = await deepLTranslateTwo(
    title,
    content,
    "EN",
    authKey
  );
  const [titleFr, contentFr] = await deepLTranslateTwo(
    title,
    content,
    "FR",
    authKey
  );

  return { titleEn, contentEn, titleFr, contentFr };
}
