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

/**
 * Holds the app's JavaScript (not CSS) until the returned function is called: "the visitor acts
 * while the page is still loading on a slow network". Returns `release`.
 */
export async function delayAppJavaScript(page: Page): Promise<() => void> {
  let release!: () => void;
  const gate = new Promise<void>((resolve) => (release = resolve));
  await page.route(
    (url) => url.pathname.startsWith("/_next/static/") && url.pathname.endsWith(".js"),
    async (route) => {
      await gate;
      await route.continue();
    },
  );
  return release;
}
