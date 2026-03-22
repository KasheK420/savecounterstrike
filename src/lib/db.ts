/**
 * @fileoverview Prisma client singleton for database access.
 *
 * Creates a single PrismaClient instance reused across hot reloads in development.
 * Query logging is enabled only in development mode.
 *
 * @module db
 * @see {@link https://www.prisma.io/docs/orm/more/help-and-troubleshooting/help-articles/nextjs-prisma-client-dev-practices|Prisma Best Practices}
 */

import { PrismaClient } from "@prisma/client";

// ── Singleton Pattern ───────────────────────────────────────

/** Global object to persist Prisma client across hot reloads */
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

/**
 * Prisma client instance.
 * Uses global instance in development to prevent connection exhaustion during hot reloads.
 */
export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["query"] : [],
  });

// Store in global for hot reload persistence (development only)
if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db;
