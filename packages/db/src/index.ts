import { PrismaClient, Prisma } from "@prisma/client";
import type { User, Schedule, SentMessage, QuotesBank } from "@prisma/client";
import { PrismaLibSql } from "@prisma/adapter-libsql";
import path from "path";
import { fileURLToPath } from "url";

// Determine the database path relative to the db package
// Use import.meta.url for ESM compatibility, fallback to __dirname for CJS
const getCurrentDir = () => {
  try {
    // ESM
    return path.dirname(fileURLToPath(import.meta.url));
  } catch {
    // CJS
    return __dirname;
  }
};

const getDbPath = () => {
  const currentDir = getCurrentDir();
  return path.join(currentDir, "..", "prisma", "dev.db");
};

const databaseUrl = process.env.DATABASE_URL || `file:${getDbPath()}`;

// Create Prisma adapter using libSQL with the database URL config
const adapter = new PrismaLibSql({ url: databaseUrl });

// Create a global Prisma client instance for reuse
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter,
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

// Re-export Prisma client and types
export { PrismaClient, Prisma };
export type { User, Schedule, SentMessage, QuotesBank };

// Backward compatibility export
export const dbReady = true;