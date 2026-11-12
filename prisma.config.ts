// Prisma CLI configuration (Prisma 7). The schema no longer holds the connection URL.
import { existsSync } from "node:fs";
import { defineConfig } from "prisma/config";

// Load a local .env for CLI commands (migrate, seed, studio). Node 24 has this built in,
// so no dotenv dependency is needed. CI and the server set real env vars instead.
if (existsSync(".env")) process.loadEnvFile(".env");

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    // `prisma generate` doesn't connect, so an empty URL is fine there (e.g. postinstall in CI).
    url: process.env.DATABASE_URL ?? "",
  },
});
