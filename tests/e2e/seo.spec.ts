import { expect, test } from "@playwright/test";

// Phase 8 (08 §7, F1.2): robots.txt, sitemap.xml and the admin-only draft preview.

test("robots.txt keeps crawlers out of admin, API and search", async ({ request }) => {
  const res = await request.get("/robots.txt");
  expect(res.status()).toBe(200);
  const body = await res.text();
  for (const path of ["/admin", "/api", "/search"]) expect(body).toContain(`Disallow: ${path}`);
  expect(body).toMatch(/Sitemap: https?:\/\/.+\/sitemap\.xml/);
});

test("sitemap.xml lists public pages, categories, products and posts", async ({ request }) => {
  const res = await request.get("/sitemap.xml");
  expect(res.status()).toBe(200);
  const xml = await res.text();
  for (const path of ["/contact</loc>", "/categories/sofas</loc>", "/products/demo-", "/blog/"]) {
    expect(xml).toContain(path);
  }
  expect(xml).not.toContain("/admin");
  expect(xml).not.toContain("/search");
});

test("?preview=1 doesn't reveal anything to visitors", async ({ page }) => {
  // Not signed in: a published product renders normally and an unknown slug is still not found.
  await page.goto("/products/no-such-product?preview=1");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("We couldn't find that page");
  await expect(page.getByText("Only you can see this")).toHaveCount(0);
});
