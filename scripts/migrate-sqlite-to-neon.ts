/**
 * 一次性：从本地 prisma/dev.db（SQLite）把数据导入 Neon（.env 里的 DATABASE_URL）。
 * 保留原有 id，已存在的 id 会跳过（skipDuplicates）。
 *
 * 用法：确保 .env 中 DATABASE_URL 为 Neon 连接串，然后：
 *   npm run db:migrate-sqlite
 */
import "dotenv/config";
import Database from "better-sqlite3";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const sqlitePath = path.join(__dirname, "..", "prisma", "dev.db");

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error("缺少 DATABASE_URL。请在 .env 中配置 Neon 连接串。");
  process.exit(1);
}

if (!connectionString.startsWith("postgresql:")) {
  console.error("DATABASE_URL 应为 postgresql:// 开头的 Neon 连接串。");
  process.exit(1);
}

const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });
const sqlite = new Database(sqlitePath, { readonly: true });

function bool(v: unknown): boolean {
  if (typeof v === "boolean") return v;
  if (v === 1 || v === "1") return true;
  if (v === 0 || v === "0") return false;
  return Boolean(v);
}

async function main() {
  const thoughts = sqlite.prepare("SELECT * FROM Thought").all() as Record<
    string,
    unknown
  >[];
  const comments = sqlite.prepare("SELECT * FROM Comment").all() as Record<
    string,
    unknown
  >[];
  const photos = sqlite.prepare("SELECT * FROM Photo").all() as Record<
    string,
    unknown
  >[];
  const requests = sqlite.prepare("SELECT * FROM AccessRequest").all() as Record<
    string,
    unknown
  >[];

  console.log(
    `SQLite: ${thoughts.length} 条随想, ${comments.length} 条评论, ${photos.length} 张照片, ${requests.length} 条访问申请`
  );

  if (thoughts.length) {
    const r = await prisma.thought.createMany({
      data: thoughts.map((t) => ({
        id: String(t.id),
        title: String(t.title),
        content: String(t.content),
        isPublic: bool(t.isPublic),
        createdAt: new Date(String(t.createdAt)),
        updatedAt: new Date(String(t.updatedAt)),
      })),
      skipDuplicates: true,
    });
    console.log("Thought → Neon:", r);
  }

  if (comments.length) {
    const r = await prisma.comment.createMany({
      data: comments.map((c) => ({
        id: String(c.id),
        thoughtId: String(c.thoughtId),
        author: String(c.author),
        content: String(c.content),
        createdAt: new Date(String(c.createdAt)),
      })),
      skipDuplicates: true,
    });
    console.log("Comment → Neon:", r);
  }

  if (photos.length) {
    const r = await prisma.photo.createMany({
      data: photos.map((p) => ({
        id: String(p.id),
        filename: String(p.filename),
        caption: p.caption != null ? String(p.caption) : null,
        isPublic: bool(p.isPublic),
        createdAt: new Date(String(p.createdAt)),
      })),
      skipDuplicates: true,
    });
    console.log("Photo → Neon:", r);
  }

  if (requests.length) {
    const r = await prisma.accessRequest.createMany({
      data: requests.map((a) => ({
        id: String(a.id),
        name: String(a.name),
        contact: a.contact != null ? String(a.contact) : null,
        message: a.message != null ? String(a.message) : null,
        status: String(a.status),
        accessToken: a.accessToken != null ? String(a.accessToken) : null,
        createdAt: new Date(String(a.createdAt)),
      })),
      skipDuplicates: true,
    });
    console.log("AccessRequest → Neon:", r);
  }

  sqlite.close();
  await prisma.$disconnect();
  console.log("\n完成。若 count 为 0 且库中已有相同 id，表示已跳过重复。");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
