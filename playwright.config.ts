import { defineConfig, devices } from "@playwright/test";

const PORT = 3100;

// E2E runs against a production build (TESTING §1). The placeholder env lets the server boot
// without a database; pages that need data get a seeded test DB from Phase 3 onwards.
export default defineConfig({
  testDir: "tests/e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? "github" : "list",
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: "on-first-retry",
  },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
    { name: "mobile", use: { ...devices["Pixel 7"] } },
  ],
  webServer: {
    command: `npm run start -- -p ${PORT}`,
    url: `http://localhost:${PORT}`,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    env: {
      DATABASE_URL: process.env.DATABASE_URL ?? "mysql://test:test@localhost:3306/artifex_test",
      AUTH_SECRET: process.env.AUTH_SECRET ?? "e2e-only-secret-not-used-in-production-xxxxxxxx",
      NEXT_PUBLIC_SITE_URL: `http://localhost:${PORT}`,
      NEXT_PUBLIC_MEDIA_URL: process.env.NEXT_PUBLIC_MEDIA_URL ?? "https://media.example.com",
    },
  },
});
