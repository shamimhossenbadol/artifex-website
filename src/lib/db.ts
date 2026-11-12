// Shared Prisma client for the running app. Only src/server/repositories may import this.
import { createPrismaClient, type PrismaClient } from "@/lib/prisma";
import { serverEnv } from "@/lib/env";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

function getClient(): PrismaClient {
  if (!globalForPrisma.prisma) {
    globalForPrisma.prisma = createPrismaClient(serverEnv().DATABASE_URL);
  }
  return globalForPrisma.prisma;
}

/**
 * Lazily created so importing this module never opens a pool (e.g. during `next build`).
 * The global cache survives dev hot reloads and keeps exactly one pool per process in prod.
 */
export const db: PrismaClient = new Proxy({} as PrismaClient, {
  get(_target, prop) {
    const client = getClient();
    const value: unknown = Reflect.get(client, prop, client);
    return typeof value === "function" ? value.bind(client) : value;
  },
});
