import { expect, test, type Page } from "@playwright/test";
import { blockAppJavaScript } from "./helpers";

// Uses the demo catalogue (SEED_DEMO=true), like catalogue.spec.ts.

async function openSearch(page: Page) {
  await page.getByRole("button", { name: "Search" }).filter({ visible: true }).first().click();
  const dialog = page.getByRole("dialog", { name: "Search" });
  await expect(dialog).toBeVisible();
  return dialog;
}

test.describe("search API (F2)", () => {
  test("returns at most 6 ranked products and matching categories", async ({ request }) => {
    const res = await request.get("/api/search?q=sofa");
    expect(res.status()).toBe(200);
    expect(res.headers()["cache-control"]).toBe("public, max-age=60");
    const body = await res.json();
    expect(body.products.length).toBe(6);
    expect(
      body.products[0].title.toLowerCase().startsWith("sofa") ||
        body.products[0].title.toLowerCase().includes("sofa"),
    ).toBe(true);
    expect(body.categories).toEqual([{ name: "Sofas", href: "/categories/sofas" }]);
  });

  test("every term must match (AND)", async ({ request }) => {
    const body = await (await request.get("/api/search?q=brass%20chandelier")).json();
    const titles = body.products.map((p: { title: string }) => p.title);
    expect(titles).toEqual(
      expect.arrayContaining(["Aurelia Crystal Chandelier", "Halo Brass Ring Chandelier"]),
    );
    const none = await (await request.get("/api/search?q=brass%20sofa")).json();
    expect(none.products).toEqual([]);
  });

  test("rejects queries outside 2–60 characters", async ({ request }) => {
    expect((await request.get("/api/search?q=s")).status()).toBe(400);
    expect((await request.get("/api/search")).status()).toBe(400);
    expect((await request.get(`/api/search?q=${"x".repeat(61)}`)).status()).toBe(400);
  });

  test("treats SQL wildcards literally", async ({ request }) => {
    for (const q of ["%%", "__", "%_"]) {
      const body = await (await request.get(`/api/search?q=${encodeURIComponent(q)}`)).json();
      expect(body.products).toEqual([]);
    }
  });
});

test.describe("search overlay", () => {
  test("shows suggestions and opens a product with the keyboard", async ({ page }) => {
    await page.goto("/");
    const dialog = await openSearch(page);
    const input = dialog.getByRole("combobox");
    await expect(input).toBeFocused();

    await input.fill("chand");
    const option = dialog.getByRole("option", { name: /Aurelia Crystal Chandelier/ });
    await expect(option).toBeVisible();

    // Move to the first suggestion that is the Aurelia chandelier, then open it.
    const options = dialog.getByRole("option");
    const count = await options.count();
    for (let i = 0; i < count; i++) {
      await input.press("ArrowDown");
      if (
        (await options.nth(i).getAttribute("aria-selected")) === "true" &&
        (await options.nth(i).innerText()).includes("Aurelia")
      )
        break;
    }
    await input.press("Enter");
    await expect(page).toHaveURL(/\/products\/demo-aurelia-crystal-chandelier$/);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Aurelia Crystal Chandelier");
  });

  test("Enter without a selection goes to the results page", async ({ page }) => {
    await page.goto("/");
    const dialog = await openSearch(page);
    await dialog.getByRole("combobox").fill("sofa");
    await dialog.getByRole("combobox").press("Enter");
    await expect(page).toHaveURL(/\/search\?q=sofa$/);
    await expect(page.getByText("26 products found")).toBeVisible();
  });

  test.describe("before JavaScript loads", () => {
    test("the overlay opens and submits to /search", async ({ page }) => {
      await blockAppJavaScript(page);
      await page.goto("/");
      const dialog = await openSearch(page);
      await dialog.getByRole("combobox").fill("bed");
      await dialog.getByRole("combobox").press("Enter");
      await expect(page).toHaveURL(/\/search\?q=bed$/);
      await expect(page.getByText(/products? found/)).toBeVisible();
    });
  });
});

test.describe("search results page", () => {
  test("lists results with pagination and is noindex", async ({ page }) => {
    await page.goto("/search?q=sofa");
    await expect(page.getByText("26 products found")).toBeVisible();
    await expect(page.locator("main article")).toHaveCount(24);
    await expect(page.getByRole("link", { name: "Next page" })).toHaveAttribute(
      "href",
      "/search?q=sofa&page=2",
    );
    await expect(page.locator('meta[name="robots"][content*="noindex"]').first()).toBeAttached();
  });

  test("shows the no-results state", async ({ page }) => {
    await page.goto("/search?q=zzzqqq");
    await expect(page.getByText("No results for “zzzqqq”")).toBeVisible();
    await expect(page.getByRole("link", { name: "Sofas" }).last()).toBeVisible();
  });

  test("an empty query shows the search form", async ({ page }) => {
    await page.goto("/search");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Search");
    await expect(page.locator("main").getByRole("searchbox")).toBeVisible();
  });
});
