import { ImageResponse } from "next/og";
import { splitParagraphs } from "@/lib/aboutContent";
import { getAboutProfile } from "@/lib/aboutStore";
import { loadOgFont } from "@/lib/ogFont";

export const dynamic = "force-dynamic";

const SIZE = { width: 1200, height: 630 };
const SITE_NAME = "等风来的小站";
const SITE_NAME_LATIN = "Waiting for the Wind";
const SITE_DESCRIPTION = "这里是停顿与记录。随想、相册，或藏或显，皆在静处完成。";
const SUBTITLE_MAX = 60;
const LONG_TITLE = 28;

type Card = { label: string; title: string; subtitle: string | null };

async function cardFor(page: string): Promise<{ card: Card; latin: Card } | null> {
  if (page === "home") {
    return {
      card: { label: SITE_NAME, title: SITE_NAME, subtitle: SITE_DESCRIPTION },
      latin: { label: SITE_NAME_LATIN, title: SITE_NAME_LATIN, subtitle: null },
    };
  }
  if (page === "about") {
    const profile = await getAboutProfile();
    const intro = splitParagraphs(profile.intro.zh)[0] ?? "";
    const subtitle =
      intro.length > SUBTITLE_MAX ? `${intro.slice(0, SUBTITLE_MAX)}…` : intro || null;
    return {
      card: { label: SITE_NAME, title: profile.headline.zh, subtitle },
      latin: { label: SITE_NAME_LATIN, title: "About", subtitle: null },
    };
  }
  return null;
}

function titleSize(title: string): number {
  if (title.length <= 12) return 96;
  if (title.length <= LONG_TITLE) return 72;
  return 52;
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ page: string }> }
) {
  const cards = await cardFor((await params).page);
  if (!cards) return new Response("Not found", { status: 404 });

  const { card } = cards;
  const font = await loadOgFont(`${card.label}${card.title}${card.subtitle ?? ""}…`);
  const fitted = font ? card : cards.latin;
  // 长标题会占到四行，再放小字就超出画面
  const shown = fitted.title.length > LONG_TITLE ? { ...fitted, subtitle: null } : fitted;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: 80,
          background: "#f9f9f9",
          color: "#1a1c1c",
          fontFamily: font ? "OgSerif" : undefined,
        }}
      >
        <div style={{ display: "flex", fontSize: 26, letterSpacing: 6, color: "#7d562d" }}>
          {shown.label}
        </div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div
            style={{
              display: "flex",
              fontSize: titleSize(shown.title),
              lineHeight: 1.35,
              letterSpacing: font ? 4 : 0,
            }}
          >
            {shown.title}
          </div>
          <div style={{ display: "flex", width: 64, height: 1, marginTop: 40, background: "#7d562d" }} />
          {shown.subtitle && (
            <div
              style={{
                display: "flex",
                marginTop: 36,
                fontSize: 36,
                lineHeight: 1.5,
                color: "#444748",
              }}
            >
              {shown.subtitle}
            </div>
          )}
        </div>
      </div>
    ),
    {
      ...SIZE,
      fonts: font ? [{ name: "OgSerif", data: font, weight: 400, style: "normal" }] : undefined,
    }
  );
}
