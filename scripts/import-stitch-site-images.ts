/**
 * Download Stitch homepage (and about portrait) images at max resolution,
 * save locally, and assign to site display slots in the database.
 *
 * Run: npx tsx scripts/import-stitch-site-images.ts
 */
import "dotenv/config";
import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { put } from "@vercel/blob";
import { prisma } from "../src/lib/db";
import {
  STITCH_ABOUT_PORTRAIT,
  STITCH_HERO_IMAGE,
  STITCH_HOME_GALLERY_IMAGES,
} from "../src/lib/stitchPlaceholders";
import {
  SITE_SLOT_ABOUT_PORTRAIT,
  SITE_SLOT_HOME_HERO,
  homePreviewSlot,
  type SiteSlot,
} from "../src/lib/siteSlots";

/** Committed static assets (not gitignored like public/uploads). */
const SITE_STATIC_DIR = path.join(process.cwd(), "public", "images", "stitch-hd");
const STITCH_EXPORT_DIR = path.join(
  process.cwd(),
  "stitch_modern_visual_journal",
  "stitch_modern_visual_journal",
  "assets",
  "hd"
);

type SlotJob = { slot: SiteSlot; url: string; filename: string };

const JOBS: SlotJob[] = [
  { slot: SITE_SLOT_HOME_HERO, url: STITCH_HERO_IMAGE, filename: "home-hero" },
  ...STITCH_HOME_GALLERY_IMAGES.map((url, i) => ({
    slot: homePreviewSlot(i),
    url,
    filename: `home-preview-${i}`,
  })),
  {
    slot: SITE_SLOT_ABOUT_PORTRAIT,
    url: STITCH_ABOUT_PORTRAIT,
    filename: "about-portrait",
  },
];

/** Request largest variant from Google CDN when possible. */
function toHdUrl(url: string): string {
  if (!url.includes("googleusercontent.com")) return url;
  const base = url.split("=")[0]!;
  return `${base}=s0`;
}

function extFromContentType(ct: string | null): string {
  if (!ct) return ".jpg";
  if (ct.includes("webp")) return ".webp";
  if (ct.includes("png")) return ".png";
  if (ct.includes("gif")) return ".gif";
  return ".jpg";
}

async function downloadHd(url: string): Promise<{ buffer: Buffer; ext: string }> {
  const res = await fetch(toHdUrl(url), {
    headers: { "User-Agent": "Mozilla/5.0 (compatible; stitch-import/1.0)" },
    redirect: "follow",
  });
  if (!res.ok) {
    throw new Error(`Download failed ${res.status}: ${url.slice(0, 80)}…`);
  }
  const bytes = await res.arrayBuffer();
  const ext = extFromContentType(res.headers.get("content-type"));
  return { buffer: Buffer.from(bytes), ext };
}

async function persistFile(
  buffer: Buffer,
  baseName: string,
  ext: string
): Promise<string> {
  const file = `${baseName}${ext}`;
  await mkdir(SITE_STATIC_DIR, { recursive: true });
  await mkdir(STITCH_EXPORT_DIR, { recursive: true });

  const staticPath = path.join(SITE_STATIC_DIR, file);
  const exportPath = path.join(STITCH_EXPORT_DIR, file);
  await writeFile(staticPath, buffer);
  await writeFile(exportPath, buffer);

  const useBlob = Boolean(process.env.BLOB_READ_WRITE_TOKEN);
  if (useBlob) {
    const blob = await put(`images/stitch-hd/${file}`, buffer, {
      access: "public",
      addRandomSuffix: false,
    });
    return blob.url;
  }

  return `/images/stitch-hd/${file}`;
}

async function assignSlot(slot: SiteSlot, publicUrl: string, caption: string) {
  const existing = await prisma.photo.findFirst({ where: { siteSlot: slot } });
  if (existing) {
    await prisma.photo.delete({ where: { id: existing.id } });
  }
  await prisma.photo.create({
    data: {
      filename: publicUrl,
      caption,
      isPublic: true,
      siteSlot: slot,
    },
  });
}

async function main() {
  console.log("Importing Stitch site images (HD)…\n");

  for (const job of JOBS) {
    process.stdout.write(`  ${job.slot} … `);
    const { buffer, ext } = await downloadHd(job.url);
    const kb = (buffer.length / 1024).toFixed(1);
    const publicUrl = await persistFile(buffer, job.filename, ext);
    await assignSlot(job.slot, publicUrl, `Stitch · ${job.filename}`);
    console.log(`OK (${kb} KB) → ${publicUrl}`);
  }

  console.log("\nSaved HD copies:");
  console.log(`  ${SITE_STATIC_DIR}`);
  console.log(`  ${STITCH_EXPORT_DIR}`);
  console.log("\nSite slots updated. Open / and /about to verify.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
