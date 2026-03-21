import { PrismaClient } from "@/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error(
    "DATABASE_URL 未设置。请在 .env 中配置 PostgreSQL 连接串（如 Neon / Supabase）。参见 .env.example"
  );
}

// 传入 PoolConfig（connectionString），由适配器内部创建 Pool，避免与 @prisma/adapter-pg
// 嵌套的 @types/pg 和项目根目录 @types/pg 对 Pool 类型重复定义导致 TS 构建失败（如 Vercel）。
const adapter = new PrismaPg({ connectionString });

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma ?? new PrismaClient({ adapter });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
