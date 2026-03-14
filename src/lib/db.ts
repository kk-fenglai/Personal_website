import { PrismaClient } from "@/generated/prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import path from "path";

const dbPath = process.env.DATABASE_URL
  ? process.env.DATABASE_URL.replace(/^file:/, "")
  : "prisma/dev.db";
const absolutePath = path.isAbsolute(dbPath)
  ? dbPath
  : path.resolve(process.cwd(), dbPath);

const adapter = new PrismaBetterSqlite3({
  url: absolutePath,
});

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma ?? new PrismaClient({ adapter });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
