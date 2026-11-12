import { expect, test } from "@playwright/test";

// Homepage (F6, 05 §3). Data-dependent checks need the seeded DB + demo catalogue/posts.

test("home page renders with security headers", async ({ page }) => {
  const response = await page.goto("/");
  expect(response?.status()).toBe(200);
  await expect(page.getByRole("heading", { level: 1 })).toHaveCount(1);

  const headers = response?.headers() ?? {};
  expect(headers["x-content-type-options"]).toBe("nosniff");
  expect(headers["content-security-policy"]).toContain("frame-ancestors 'self'");
  expect(headers["x-powered-by"]).toBeUndefined();
});

test("shows the sections in order and hides empty ones", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "Crafted furniture for modern homes",
  );
  const sections = page.locator("main section h2");
  await expect(sections.first()).toBeVisible();
  const titles = await sections.allInnerTexts();
  expect(titles).toEqual([
    "Shop by category",
    "New arrivals",
    "Decor your dreams",
    "Featured pieces",
    "Most loved",
    "Not sure what fits your space? Talk to us.",
    "Ideas for your home",
  ]);
  // No promo banners are seeded, so that section is hidden, not left empty.
  await expect(page.getByRole("region", { name: "Offers" })).toHaveCount(0);
});

test("category tiles link to all six categories", async ({ page }) => {
  await page.goto("/");
  const tiles = page.locator("section[aria-labelledby=categories-heading] li a");
  await expect(tiles).toHaveCount(6);
  await expect(tiles.first()).toHaveAttribute("href", "/categories/sofas");
  await expect(tiles.last()).toHaveAttribute("href", "/categories/chandeliers");
});

test("rails link to products and the CTA band opens WhatsApp", async ({ page }) => {
  await page.goto("/");
  const featured = page.locator("section[aria-labelledby=featured] article a");
  await expect(featured.first()).toHaveAttribute("href", /^\/products\/demo-/);
  await expect(page.getByRole("link", { name: "Message on WhatsApp" })).toHaveAttribute(
    "href",
    /^https:\/\/wa\.me\/8801757758388\?text=/,
  );
});

test("has Organization, WebSite (search) and FurnitureStore JSON-LD", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("section[aria-labelledby=categories-heading]")).toBeVisible();
  const ld = await page
    .locator('script[type="application/ld+json"]')
    .evaluateAll((els) => els.flatMap((e) => [JSON.parse(e.textContent ?? "{}")].flat()));
  const types = ld.map((x: { "@type": string }) => x["@type"]);
  expect(types).toEqual(expect.arrayContaining(["Organization", "WebSite", "FurnitureStore"]));
  const site = ld.find((x: { "@type": string }) => x["@type"] === "WebSite");
  expect(site.potentialAction.target.urlTemplate).toMatch(/\/search\?q=\{search_term_string\}$/);
});
