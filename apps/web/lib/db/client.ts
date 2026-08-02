import { PrismaPg } from "@prisma/adapter-pg";

import { PrismaClient } from "@/lib/generated/prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

const adapter = new PrismaPg(
  {
    connectionString: process.env.DATABASE_URL,
    // Keep idle connections short-lived so a connection the remote
    // Postgres server has silently closed is never handed back out of
    // the pool for reuse (surfaced in dev as a ConnectionClosed error
    // after a period of inactivity).
    idleTimeoutMillis: 10_000,
    connectionTimeoutMillis: 10_000,
  },
  {
    onPoolError: (error) => {
      console.error("Postgres pool error:", error.message);
    },
    onConnectionError: (error) => {
      console.error("Postgres connection error:", error.message);
    },
  }
);

export const prisma =
  globalForPrisma.prisma ?? new PrismaClient({ adapter });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
