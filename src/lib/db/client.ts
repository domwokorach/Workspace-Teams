import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import { PrismaClient } from "@/generated/prisma/client";

declare global {
  // eslint-disable-next-line no-var
  var __prisma: PrismaClient | undefined;
  // eslint-disable-next-line no-var
  var __pgPool: Pool | undefined;
}

function createClient() {
  const pool =
    globalThis.__pgPool ??
    new Pool({ connectionString: process.env.DATABASE_URL });
  const adapter = new PrismaPg(pool);
  if (process.env.NODE_ENV !== "production") {
    globalThis.__pgPool = pool;
  }
  return new PrismaClient({ adapter });
}

export const prisma = globalThis.__prisma ?? createClient();

if (process.env.NODE_ENV !== "production") {
  globalThis.__prisma = prisma;
}
