import { expect, test } from "@playwright/test";
import { blockAppJavaScript } from "./helpers";

test.describe("site layout", () => {
  test("has landmarks, one h1 and a working skip link", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("h1")).toHaveCount(1);
    await expect(page.getByRole("contentinfo")).toBeVisible();

    await page.keyboard.press("Tab");
    const skip = page.getByRole("link", { name: "Skip to content" });
    await expect(skip).toBeFocused();
    await skip.press("Enter");
    await expect(page).toHaveURL(/#main-content$/);
  });

  test("search and menu overlays live outside the streamed header (ADR-043)", async ({ page }) => {
    // If they were inside the header, an overlay opened before the header finished streaming
    // would be removed when the real header replaces its fallback.
    await page.goto("/");
    await expect(page.locator("dialog#search-dialog")).toHaveCount(1);
    await expect(page.locator("dialog#mobile-menu")).toHaveCount(1);
    await expect(page.locator("header dialog")).toHaveCount(0);
  });

  test("unknown URLs return a branded 404", async ({ page }) => {
    const response = await page.goto("/this-page-does-not-exist");
    expect(response?.status()).toBe(404);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("We couldn't find that page");
    await expect(page.getByRole("search")).toBeVisible();
  });

  test("no horizontal scroll", async ({ page }) => {
    // Compare with clientWidth: on phones innerWidth grows with overflowing content, so the old
    // check passed while the homepage was 608 px wide on a 390 px screen.
    for (const path of [
      "/",
      "/products",
      "/products/demo-signature-l-shape-sofa",
      "/blog",
      "/contact",
    ]) {
      await page.goto(path);
      const widths = await page.evaluate(() => ({
        scroll: document.documentElement.scrollWidth,
        client: document.documentElement.clientWidth,
      }));
      expect(widths.scroll, path).toBeLessThanOrEqual(widths.client);
    }
  });
});

async function expectDrawerWorks(page: import("@playwright/test").Page) {
  await page.goto("/");
  await page.getByRole("button", { name: "Open menu" }).click();

  const drawer = page.getByRole("dialog", { name: "Menu" });
  await expect(drawer).toBeVisible();
  await expect(drawer.getByRole("link", { name: "Journal" })).toBeVisible();
  // Modal dialog: keyboard focus is inside the drawer, not on the page behind it.
  await expect
    .poll(() => page.evaluate(() => !!document.activeElement?.closest("#mobile-menu")))
    .toBe(true);

  await page.keyboard.press("Escape");
  await expect(drawer).toBeHidden();
}

test.describe("mobile menu", () => {
  test.skip(({ isMobile }) => !isMobile, "mobile header only");

  test("opens as a modal drawer and closes with Escape", async ({ page }) => {
    await expectDrawerWorks(page);
  });

  test.describe("before JavaScript loads", () => {
    // Slow networks: the menu must work from the HTML alone (Invoker Commands, ADR-024).
    test("opens and closes before the app's JavaScript has loaded", async ({ page }) => {
      await blockAppJavaScript(page);
      await expectDrawerWorks(page);
    });
  });
});

test.describe("desktop header and floating buttons (ADR-035)", () => {
  test.skip(({ isMobile }) => isMobile, "desktop header only");

  test("header has company links and no Chairs; Messenger sits above WhatsApp", async ({
    page,
  }) => {
    await page.goto("/");
    const nav = page.getByRole("navigation", { name: "Main" });
    for (const name of ["Sofas", "Journal", "About", "Contact"]) {
      await expect(nav.getByRole("link", { name, exact: true })).toBeVisible();
    }
    await expect(nav.getByRole("link", { name: "Chairs" })).toHaveCount(0);

    const messenger = page.getByRole("link", { name: /on Facebook Messenger/ });
    await expect(messenger).toHaveAttribute("href", "https://m.me/artifexfurniturebd");
    await expect(page.getByRole("link", { name: /Chat with .* on WhatsApp/ })).toBeVisible();

    // The footer is compact: no category list.
    await expect(page.getByRole("contentinfo").getByRole("link", { name: "Sofas" })).toHaveCount(0);
  });
});

test.describe("phone layout (ADR-089)", () => {
  test.skip(({ isMobile }) => !isMobile, "phones only");

  test("list pages show the grid alone; the heading stays for screen readers", async ({ page }) => {
    for (const url of ["/products", "/categories/sofas"]) {
      await page.goto(url);
      await expect(page.locator("main article").first()).toBeVisible();
      await expect(page.getByRole("heading", { level: 1 })).toHaveCount(1);
      await expect(page.getByRole("navigation", { name: "Breadcrumb" })).toBeHidden();
      await expect(page.getByRole("navigation", { name: "Sort products" })).toBeHidden();
    }
  });

  test("no breadcrumbs on content pages", async ({ page }) => {
    for (const url of ["/about", "/contact", "/blog"]) {
      await page.goto(url);
      await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
      await expect(page.getByRole("navigation", { name: "Breadcrumb" })).toBeHidden();
    }
  });

  test("© and credit are readable, clear of the floating buttons", async ({ page }) => {
    await page.goto("/products");
    const credit = page.getByRole("contentinfo").getByText("Developed by");
    await credit.scrollIntoViewIfNeeded();
    await expect(credit).toBeVisible();
    const whatsapp = page.getByRole("link", { name: /Chat with .* on WhatsApp/ });
    const [creditBox, fabBox] = await Promise.all([credit.boundingBox(), whatsapp.boundingBox()]);
    expect(creditBox && fabBox).toBeTruthy();
    if (creditBox && fabBox) expect(creditBox.x + creditBox.width).toBeLessThanOrEqual(fabBox.x);
  });

  test("product pages drop the © and credit bar (ADR-071)", async ({ page }) => {
    await page.goto("/products/demo-signature-l-shape-sofa");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expect(page.getByRole("contentinfo").getByText("Developed by")).toBeHidden();
  });
});
