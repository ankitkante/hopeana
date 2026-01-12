import { PrismaClient, Prisma } from "@prisma/client";
import type { User, Schedule, SentMessage, QuotesBank } from "@prisma/client";

// Create a global Prisma client instance for reuse
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

// Re-export Prisma client and types
export { PrismaClient, Prisma };
export type { User, Schedule, SentMessage, QuotesBank };

// Backward compatibility export
export const dbReady = true;