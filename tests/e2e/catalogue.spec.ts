import { expect, test } from "@playwright/test";

// Needs the demo catalogue (SEED_DEMO=true): CI seeds it; locally point DATABASE_URL at a DB that has it.
const SOFA = "/products/demo-signature-l-shape-sofa";

function prices(texts: string[]): number[] {
  return texts
    .map((t) => /৳\s*([\d,]+)/.exec(t)?.[1])
    .filter((v): v is string => Boolean(v))
    .map((v) => Number(v.replace(/,/g, "")));
}

test.describe("catalogue listing (F1.1)", () => {
  test("category paginates 24 per page with crawlable links", async ({ page }) => {
    await page.goto("/categories/sofas");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Sofas");
    await expect(page.getByText("26 products")).toBeVisible();
    await expect(page.locator("main article")).toHaveCount(24);

    const next = page.getByRole("link", { name: "Next page" });
    await expect(next).toHaveAttribute("href", "/categories/sofas?page=2");
    await next.click();
    await expect(page).toHaveURL(/page=2$/);
    await expect(page.locator("main article")).toHaveCount(2);
  });

  test("price sort orders by effective price with 'price on request' last", async ({ page }) => {
    await page.goto("/categories/sofas?sort=price_asc");
    // Wait for the streamed listing before reading it.
    await expect(page.locator("main article")).toHaveCount(24);
    const cards = await page.locator("main article").allInnerTexts();
    const values = prices(cards);
    expect(values.length).toBeGreaterThan(5);
    // Each card shows the effective (first) price; compare consecutive cards.
    const firstPrices = cards
      .map((c) => prices([c])[0])
      .filter((v): v is number => v !== undefined);
    expect(firstPrices).toEqual([...firstPrices].sort((a, b) => a - b));
    expect(cards.at(-1)).toContain("Price on request");
  });

  test("on-sale filter only shows discounted products", async ({ page }) => {
    await page.goto("/products?sale=1");
    const cards = page.locator("main article");
    await expect(cards.first()).toBeVisible();
    for (const text of await cards.allInnerTexts()) expect(text).toMatch(/-\d+%/);
  });

  test("an empty category shows the empty state", async ({ page }) => {
    await page.goto("/categories/curtains");
    await expect(page.getByText("No curtains online yet.")).toBeVisible();
  });

  test("unknown category and out-of-range page render not-found with noindex", async ({ page }) => {
    for (const url of [
      "/categories/no-such-category",
      "/categories/sofas?page=99",
      "/products?page=abc",
    ]) {
      await page.goto(url);
      await expect(page.getByRole("heading", { level: 1 })).toHaveText(
        "We couldn't find that page",
      );
      await expect(page.locator('meta[name="robots"][content*="noindex"]').first()).toBeAttached();
    }
  });
});

test.describe("product detail (F1.2–F1.4, F3)", () => {
  test("shows price, specs, related products and Product JSON-LD", async ({ page }) => {
    await page.goto(SOFA);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Signature L-Shape Sofa");
    await expect(page.getByText("-14%").first()).toBeVisible();
    await expect(page.getByRole("heading", { name: "Specifications" })).toBeVisible();
    await expect(page.locator("section[aria-labelledby=related] article")).toHaveCount(4);

    const ld = await page
      .locator('script[type="application/ld+json"]')
      .evaluateAll((els) => els.flatMap((e) => JSON.parse(e.textContent ?? "[]")));
    const product = ld.find((x: { "@type": string }) => x["@type"] === "Product");
    expect(product.offers).toMatchObject({ priceCurrency: "BDT", price: 125000 });
  });

  test("selected colour goes into the WhatsApp message", async ({ page }) => {
    await page.goto(SOFA);
    const cta = page.getByRole("link", { name: "Message on WhatsApp" });
    await expect(cta).toHaveAttribute("href", /wa\.me\/\d+\?text=/);

    await page.getByRole("button", { name: "Forest Green" }).click();
    await expect(page.getByText("Colour: Forest Green")).toBeVisible();
    const text = new URL((await cta.getAttribute("href"))!).searchParams.get("text");
    expect(text).toContain("Signature L-Shape Sofa (Colour: Forest Green)");
    expect(text).toMatch(/https?:\/\/[^ ]+\/products\/demo-signature-l-shape-sofa/);
  });

  test("mobile sticky WhatsApp bar appears after scrolling past the main button", async ({
    page,
    isMobile,
  }) => {
    test.skip(!isMobile, "mobile only");
    await page.goto(SOFA);
    const bar = page.locator("[data-hide-whatsapp-fab]");
    await expect(bar).toHaveAttribute("aria-hidden", "true");
    await page.getByRole("heading", { name: "Specifications" }).scrollIntoViewIfNeeded();
    await expect(bar).toHaveAttribute("aria-hidden", "false");
    // The floating button gives way to the product's own bar on mobile.
    await expect(page.getByRole("link", { name: /Chat with .* on WhatsApp/ })).toBeHidden();
  });

  test("an unknown product renders not-found", async ({ page }) => {
    await page.goto("/products/demo-does-not-exist");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("We couldn't find that page");
  });
});
