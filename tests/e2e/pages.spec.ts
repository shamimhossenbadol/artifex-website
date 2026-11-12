import { expect, test } from "@playwright/test";

// Journal, Contact and About (F4, F5, F7). Needs the demo posts (SEED_DEMO=true).
const POST = "/blog/demo-how-to-size-a-chandelier-for-your-living-or-dining-room";

async function jsonLdTypes(page: import("@playwright/test").Page): Promise<string[]> {
  return page
    .locator('script[type="application/ld+json"]')
    .evaluateAll((els) =>
      els.flatMap((e) => [JSON.parse(e.textContent ?? "{}")].flat().map((x) => x["@type"])),
    );
}

test.describe("Journal (F4)", () => {
  test("lists posts with the newest featured", async ({ page }) => {
    await page.goto("/blog");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Journal");
    await expect(page.locator("main article")).toHaveCount(4);
    await expect(page.locator("main article").first().getByRole("heading")).toHaveText(
      "How to choose the right sofa size for a Dhaka flat",
    );
  });

  test("a post shows meta, Markdown, share links, related posts and BlogPosting JSON-LD", async ({
    page,
  }) => {
    await page.goto(POST);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(
      "How to size a chandelier for your living or dining room",
    );
    await expect(page.getByText(/\d+ min read/)).toBeVisible();
    await expect(page.getByRole("heading", { level: 2, name: "Hanging height" })).toBeVisible();

    const facebook = page.getByRole("link", { name: "Facebook" }).first();
    await expect(facebook).toHaveAttribute(
      "href",
      /facebook\.com\/sharer\/sharer\.php\?u=https?%3A%2F%2F.+%2Fblog%2Fdemo-how-to-size/,
    );
    await expect(page.getByRole("button", { name: "Copy link" })).toBeVisible();

    const related = page.locator("aside[aria-labelledby=related-posts] article");
    await expect(related).toHaveCount(3);
    // The other buying guides share a tag, so they come first.
    await expect(related.first()).toContainText(/sofa size|Dining tables/);

    expect(await jsonLdTypes(page)).toEqual(
      expect.arrayContaining(["BlogPosting", "BreadcrumbList"]),
    );
  });

  test("an unknown post renders not-found", async ({ page }) => {
    await page.goto("/blog/demo-no-such-post");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("We couldn't find that page");
  });
});

test.describe("Contact & location (F5)", () => {
  test("shows address, phone, WhatsApp, hours, directions and FurnitureStore JSON-LD", async ({
    page,
  }) => {
    await page.goto("/contact");
    const main = page.locator("main");
    await expect(main.getByText(/Uttara/).first()).toBeVisible();
    await expect(main.locator('a[href^="tel:+880"]').first()).toBeVisible();
    await expect(main.locator('a[href^="https://wa.me/"]').first()).toBeVisible();
    await expect(main.getByRole("row", { name: /Every day\s+10:00 AM – 10:00 PM/ })).toBeVisible();
    await expect(main.getByRole("link", { name: "Get directions" })).toHaveAttribute(
      "href",
      /^https:\/\/www\.google\.com\/maps\//,
    );
    expect(await jsonLdTypes(page)).toContain("FurnitureStore");
  });

  test("the map loads only when the visitor taps it", async ({ page }) => {
    await page.goto("/contact");
    await expect(page.locator("iframe")).toHaveCount(0);
    await page.getByRole("button", { name: /Tap to load the map/ }).click();
    await expect(page.locator("iframe")).toHaveAttribute(
      "src",
      /^https:\/\/www\.google\.com\/maps\/embed\?pb=/,
    );
  });

  test("open status follows Dhaka time", async ({ page }) => {
    // 15:00 in Dhaka (UTC+6): open every day until 10 PM.
    await page.clock.setFixedTime(new Date("2026-11-12T15:00:00+06:00"));
    await page.goto("/contact");
    await expect(page.getByText("Open now · until 10:00 PM")).toBeVisible();

    // 22:30 in Dhaka: closed for the night.
    await page.clock.setFixedTime(new Date("2026-11-12T22:30:00+06:00"));
    await page.reload();
    await expect(page.getByText("Closed now")).toBeVisible();
  });
});

test.describe("About (F7)", () => {
  test("shows the story, values and a call to action", async ({ page }) => {
    await page.goto("/about");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(
      "Furniture for the way you live",
    );
    await expect(page.locator("main").getByText(/showroom in Uttara/)).toBeVisible();
    await expect(page.getByRole("heading", { level: 3 })).toHaveCount(3);
    await expect(page.getByRole("link", { name: "Visit the showroom" })).toHaveAttribute(
      "href",
      "/contact",
    );
  });
});
