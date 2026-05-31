/**
 * 一次性：为缺少英/法译文的随想补全 LibreTranslate 翻译。
 *
 * 用法：确保 .env 中 DATABASE_URL 与 LibreTranslate 相关变量已配置，然后：
 *   npm run db:backfill-thought-translations
 */
import "dotenv/config";
import { prisma } from "../src/lib/db";
import { thoughtNeedsTranslation } from "../src/lib/ensureThoughtTranslations";
import { translateAndSaveThought } from "../src/lib/thoughtTranslateAndSave";

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function main() {
  const thoughts = await prisma.thought.findMany({
    orderBy: { createdAt: "asc" },
  });
  const pending = thoughts.filter(thoughtNeedsTranslation);
  console.log(`[backfill] ${pending.length}/${thoughts.length} thoughts need translation`);

  for (let i = 0; i < pending.length; i++) {
    const thought = pending[i];
    const label = thought.title.slice(0, 48);
    console.log(`[backfill] ${i + 1}/${pending.length} ${thought.id} — ${label}`);
    await translateAndSaveThought(thought.id, thought.title, thought.content);
    if (i < pending.length - 1) {
      await sleep(1000);
    }
  }

  console.log("[backfill] done");
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
