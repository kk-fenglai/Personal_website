import type { Metadata } from "next";
import { prisma } from "@/lib/db";
import { splitParagraphs } from "@/lib/aboutContent";
import { getAboutProfile, listProjects } from "@/lib/aboutStore";
import { SITE_SLOT_ABOUT_PORTRAIT } from "@/lib/siteSlots";
import { STITCH_ABOUT_PORTRAIT } from "@/lib/stitchPlaceholders";
import { AboutView } from "./AboutView";

// 内容来自数据库且后台保存后要立刻生效；构建时也连不上数据库
export const dynamic = "force-dynamic";

const SITE_NAME = "等风来的小站";
const FALLBACK_DESCRIPTION = "这里是停顿与记录。随想、相册，或藏或显，皆在静处完成。";

export async function generateMetadata(): Promise<Metadata> {
  const profile = await getAboutProfile();
  const title = `${profile.headline.zh} | ${SITE_NAME}`;
  const description =
    splitParagraphs(profile.intro.zh)[0]?.slice(0, 120) ?? FALLBACK_DESCRIPTION;
  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: [{ url: "/api/og/about", width: 1200, height: 630 }],
    },
    twitter: { card: "summary_large_image" },
  };
}

export default async function AboutPage() {
  const [profile, projects, portrait] = await Promise.all([
    getAboutProfile(),
    listProjects({ includeHidden: false }),
    prisma.photo.findFirst({
      where: { siteSlot: SITE_SLOT_ABOUT_PORTRAIT, isPublic: true },
      select: { filename: true },
    }),
  ]);

  return (
    <AboutView
      profile={profile}
      projects={projects}
      portraitSrc={portrait?.filename ?? STITCH_ABOUT_PORTRAIT}
    />
  );
}
