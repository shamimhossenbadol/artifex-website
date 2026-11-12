import type { Page } from "@playwright/test";

/**
 * Simulates "the app's JavaScript bundle hasn't loaded yet" (slow mobile networks): blocks every
 * Next.js chunk so React never hydrates, while the small inline scripts in the HTML stream still
 * run (they reveal streamed sections). Turning JavaScript off entirely is not realistic, because
 * then streamed content is never revealed in any browser.
 */
export async function blockAppJavaScript(page: Page): Promise<void> {
  await page.route("**/_next/static/chunks/**", (route) => route.abort());
}
