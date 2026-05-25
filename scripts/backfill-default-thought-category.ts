import { prisma } from "@/lib/db";

async function main() {
  const DEFAULT_NAME = "随手记";

  const category = await prisma.thoughtCategory.upsert({
    where: { name: DEFAULT_NAME },
    create: { name: DEFAULT_NAME },
    update: {},
  });

  const res = await prisma.thought.updateMany({
    where: { categoryId: null },
    data: { categoryId: category.id },
  });

  console.log(
    `[backfill] ensured category "${DEFAULT_NAME}" (${category.id}); updated ${res.count} thoughts`
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

