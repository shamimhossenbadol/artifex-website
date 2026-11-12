// Prisma client factory using the MariaDB/MySQL JS driver adapter (ADR-004). No env access here,
// so the seed and CLI scripts can reuse it with their own connection string.
import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import { PrismaClient } from "@/generated/prisma/client";

/** Small pool: shared hosting counts connections and memory (10 §9). */
export const DEFAULT_CONNECTION_LIMIT = 3;

export function createPrismaClient(
  databaseUrl: string,
  connectionLimit = DEFAULT_CONNECTION_LIMIT,
): PrismaClient {
  const url = new URL(databaseUrl);
  const adapter = new PrismaMariaDb({
    host: url.hostname,
    port: url.port ? Number(url.port) : 3306,
    user: decodeURIComponent(url.username),
    password: decodeURIComponent(url.password),
    database: decodeURIComponent(url.pathname.replace(/^\//, "")),
    connectionLimit,
    // Fail fast if MySQL is unreachable so pages fall back quickly instead of hanging (default 10 s).
    connectTimeout: 5000,
    acquireTimeout: 6000,
    charset: "utf8mb4",
    // Store and read DATETIME values as UTC (11 §6).
    timezone: "Z",
  });
  return new PrismaClient({ adapter });
}

export { PrismaClient };
