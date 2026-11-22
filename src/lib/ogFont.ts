const FONT_TIMEOUT_MS = 4000;

/**
 * 按卡片上实际出现的文字，向 Google Fonts 取一份思源宋体子集。
 * 任何一步失败都返回 null，由调用方改用拉丁文字渲染，避免中文显示成方块。
 */
export async function loadOgFont(text: string): Promise<ArrayBuffer | null> {
  try {
    const cssUrl = `https://fonts.googleapis.com/css2?family=Noto+Serif+SC:wght@400&text=${encodeURIComponent(text)}`;
    const css = await fetch(cssUrl, { signal: AbortSignal.timeout(FONT_TIMEOUT_MS) }).then(
      (res) => (res.ok ? res.text() : "")
    );
    const fontUrl = css.match(/src:\s*url\(([^)]+)\)\s*format\('(?:truetype|opentype)'\)/)?.[1];
    if (!fontUrl) return null;
    const res = await fetch(fontUrl, { signal: AbortSignal.timeout(FONT_TIMEOUT_MS) });
    return res.ok ? await res.arrayBuffer() : null;
  } catch {
    return null;
  }
}
