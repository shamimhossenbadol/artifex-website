import {
  expect as baseExpect,
  test,
  type Browser,
  type Locator,
  type Page,
} from "@playwright/test";

// Admin authentication (07 §1, 09 §2, TESTING §4). These tests CHANGE the admin password, so they
// only run when E2E_ADMIN_EMAIL / E2E_ADMIN_PASSWORD are set: in CI, against the throwaway CI DB.
// Never set them when pointing at a real database.
const EMAIL = process.env.E2E_ADMIN_EMAIL;
const INITIAL = process.env.E2E_ADMIN_PASSWORD;
const NEW_PASSWORD = "Walnut-Sofa-Testing-2026";

// Every sign-in runs bcrypt (pure JS, cost 12). On a busy 2-core CI runner a few in a row can pass
// the default 5 s assertion timeout, so this file waits longer.
const expect = baseExpect.configure({ timeout: 15_000 });

/**
 * After client-side navigation Next keeps the previous page mounted but hidden (back/forward
 * state), so a label can match a hidden copy too. Only look at what's on screen.
 */
const shown = (locator: Locator) => locator.filter({ visible: true });

/** The sign-in form's own message (Next's route announcer is also role="alert"). */
const loginMessage = (page: Page) => page.locator("form").getByRole("alert");

// Serial, no retries: these tests share one admin whose password changes on first login, so a
// retry would replay one-time steps and fail for the wrong reason.
test.describe.configure({ mode: "serial", retries: 0 });
test.skip(!EMAIL || !INITIAL, "admin e2e only runs in CI (E2E_ADMIN_EMAIL/PASSWORD)");
test.skip(({ isMobile }) => isMobile, "runs once, on the desktop project");

async function signIn(page: Page, email: string, password: string) {
  await page.goto("/admin/login");
  // Fill the form only once the page's JavaScript has loaded; typing earlier can race hydration.
  await page.waitForLoadState("networkidle");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password", { exact: true }).fill(password);
  await page.getByRole("button", { name: "Sign in" }).click();
}

async function newPage(browser: Browser) {
  return (await browser.newContext()).newPage();
}

test("admin pages redirect to the login page when signed out", async ({ page }) => {
  await page.goto("/admin");
  await expect(page).toHaveURL(/\/admin\/login$/);
  await page.goto("/admin/products");
  await expect(page).toHaveURL(/\/admin\/login\?next=%2Fadmin%2Fproducts$/);
});

test("a forged session cookie is rejected by requireAdmin (not just the proxy)", async ({
  page,
  context,
  baseURL,
}) => {
  await context.addCookies([{ name: "af_session", value: "forged.token.value", url: baseURL! }]);
  await page.goto("/admin/account");
  await expect(page).toHaveURL(/\/admin\/login/);
});

test("a wrong password shows a generic error", async ({ page }) => {
  await signIn(page, EMAIL!, "definitely-not-it");
  await expect(page.getByText("Invalid email or password.")).toBeVisible();
});

test("too many failures lock the email out", async ({ page }, testInfo) => {
  // A fresh email per attempt: in serial mode a retry re-runs this test, and the previous
  // attempt's lockout would still be in force for the same address.
  const victim = `nobody-lockout-${testInfo.retry}-${Date.now()}@example.com`;
  for (let i = 0; i < 5; i++) {
    await signIn(page, victim, `wrong-${i}`);
    // toHaveText reports what the form actually said if this ever fails.
    await expect(loginMessage(page), `attempt ${i + 1}`).toHaveText("Invalid email or password.");
  }
  await signIn(page, victim, "wrong-again");
  await expect(loginMessage(page)).toHaveText(/Too many attempts/);
});

test("first login forces a password change and logs out other sessions", async ({
  page,
  browser,
}) => {
  // A second device signed in before the change.
  const other = await newPage(browser);
  await signIn(other, EMAIL!, INITIAL!);
  await expect(other).toHaveURL(/\/admin\/account\/password$/);

  await signIn(page, EMAIL!, INITIAL!);
  await expect(page).toHaveURL(/\/admin\/account\/password$/);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Set a new password");

  // Other admin pages are blocked until the password is changed.
  await page.goto("/admin/products");
  await expect(page).toHaveURL(/\/admin\/account\/password$/);

  // Rules are enforced.
  await page.getByLabel("Current password").fill(INITIAL!);
  await page.getByLabel("New password", { exact: true }).fill("password123");
  await page.getByLabel("Confirm new password").fill("password123");
  await page.getByRole("button", { name: "Save and continue" }).click();
  await expect(page.getByText("too easy to guess").first()).toBeVisible();

  await page.getByLabel("Current password").fill(INITIAL!);
  await page.getByLabel("New password", { exact: true }).fill(NEW_PASSWORD);
  await page.getByLabel("Confirm new password").fill(NEW_PASSWORD);
  await page.getByRole("button", { name: "Save and continue" }).click();
  await expect(page).toHaveURL(/\/admin$/);
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Welcome");

  // The other device's session was invalidated (sessionVersion bumped).
  await other.goto("/admin");
  await expect(other).toHaveURL(/\/admin\/login/);
});

test("logout, then sign in with the new password", async ({ page }) => {
  await signIn(page, EMAIL!, NEW_PASSWORD);
  await expect(page).toHaveURL(/\/admin$/);
  await page.getByRole("button", { name: "Log out" }).filter({ visible: true }).click();
  await expect(page).toHaveURL(/\/admin\/login$/);
  await page.goto("/admin");
  await expect(page).toHaveURL(/\/admin\/login$/);

  // The old password no longer works.
  await signIn(page, EMAIL!, INITIAL!);
  await expect(page.getByText("Invalid email or password.")).toBeVisible();
});

test("admin pages are noindex and never cached", async ({ page }) => {
  const response = await page.goto("/admin/login");
  expect(response?.headers()["x-robots-tag"]).toContain("noindex");
  expect(response?.headers()["cache-control"]).toContain("no-store");
});

// --- Milestone 7b: settings and homepage editor. Non-destructive: invalid input is rejected,
// and valid saves re-save the current values. ---------------------------------------------------

test("settings tabs reject bad input and save valid values", async ({ page }) => {
  await signIn(page, EMAIL!, NEW_PASSWORD);
  await expect(page).toHaveURL(/\/admin$/);

  await page.goto("/admin/settings/contact");
  await expect(page.getByRole("link", { name: "Contact", exact: true })).toHaveAttribute(
    "aria-current",
    "page",
  );
  const number = page.getByLabel("WhatsApp number");
  const original = await number.inputValue();
  await number.fill("12345");
  await page.getByRole("button", { name: "Save changes" }).click();
  await expect(page.getByText(/Use a full number/).first()).toBeVisible();
  // A failed save keeps what was typed.
  await expect(number).toHaveValue("12345");

  await number.fill(original);
  await expect(page.getByRole("link", { name: /Test link/ })).toHaveAttribute(
    "href",
    /^https:\/\/wa\.me\/\d+/,
  );
  await page.getByRole("button", { name: "Save changes" }).click();
  await expect(page.getByText("Settings saved. The website is updated.").first()).toBeVisible();

  await page.goto("/admin/settings/location");
  const map = page.getByLabel("Map embed");
  await map.fill("https://evil.example/embed");
  await page.getByRole("button", { name: "Save changes" }).click();
  await expect(page.getByText(/Paste the embed link from Google Maps/).first()).toBeVisible();
});

test("homepage editor saves the hero and validates new banners", async ({ page }) => {
  await signIn(page, EMAIL!, NEW_PASSWORD);
  await expect(page).toHaveURL(/\/admin$/); // the session cookie is set before navigating on
  await page.goto("/admin/homepage");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Homepage");

  // The live preview follows the heading field.
  const heading = page.getByLabel("Heading", { exact: true });
  const original = await heading.inputValue();
  await heading.fill(`${original} preview`);
  await expect(page.getByText(`${original} preview`)).toBeVisible();
  await heading.fill(original);
  await page.getByRole("button", { name: "Save hero" }).click();
  await expect(page.getByText("Hero saved. The homepage is updated.").first()).toBeVisible();

  await page.getByRole("link", { name: "New banner" }).click();
  await expect(page).toHaveURL(/\/admin\/homepage\/banners\/new$/);
  await page.getByLabel("Title", { exact: true }).fill("Test banner");
  await page.getByLabel("Image description").fill("A sofa");
  await page.getByRole("button", { name: "Create banner" }).click();
  await expect(page.getByText("Choose an image for the banner.").first()).toBeVisible();
});

// --- Milestone 7c: categories. Creates a throwaway category on the CI database and removes it. --

test("categories: create, show on the site, guard delete, then delete", async ({ page }) => {
  await signIn(page, EMAIL!, NEW_PASSWORD);
  await expect(page).toHaveURL(/\/admin$/);

  await page.goto("/admin/categories/new");
  await page.getByLabel("Name", { exact: true }).fill("E2E Lounge Chairs");
  await page.getByRole("button", { name: "Create category" }).click();
  await expect(page).toHaveURL(/\/admin\/categories$/);
  await expect(page.getByText("/categories/e2e-lounge-chairs")).toBeVisible();

  // A duplicate web address is rejected and the form keeps what was typed.
  await page.goto("/admin/categories/new");
  await page.getByLabel("Name", { exact: true }).fill("E2E Lounge Chairs");
  await page.getByRole("button", { name: "Create category" }).click();
  await expect(page.getByText(/already uses this web address/).first()).toBeVisible();
  await expect(page.getByLabel("Name", { exact: true })).toHaveValue("E2E Lounge Chairs");

  // It's live on the public site straight away (cache revalidated).
  await page.goto("/categories/e2e-lounge-chairs");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("E2E Lounge Chairs");

  // Categories with products can't be deleted: they link to their products instead.
  await page.goto("/admin/categories");
  const sofas = page.getByRole("listitem").filter({ hasText: "/categories/sofas" });
  await expect(sofas.getByRole("link", { name: "View products" })).toBeVisible();
  await expect(sofas.getByRole("button", { name: "Delete" })).toHaveCount(0);

  const item = page.getByRole("listitem").filter({ hasText: "/categories/e2e-lounge-chairs" });
  await item.getByRole("button", { name: "Delete" }).click();
  await page.getByRole("dialog").getByRole("button", { name: "Delete" }).click();
  await expect(page.getByText("Category deleted.").first()).toBeVisible();
  await expect(page.getByText("/categories/e2e-lounge-chairs")).toHaveCount(0);
});

// --- Milestone 7d: products. Creates throwaway products on the CI database and removes them. ---

test("products: create a draft, publish it, duplicate and delete", async ({ page, browser }) => {
  await signIn(page, EMAIL!, NEW_PASSWORD);
  await expect(page).toHaveURL(/\/admin$/);

  await page.goto("/admin/products/new");
  await page.waitForLoadState("networkidle");
  await page.getByLabel("Title", { exact: true }).fill("E2E Walnut Bench");
  await page.getByLabel("Category").selectOption({ label: "Sofas" });
  await page.getByLabel("Short description").fill("A bench made for e2e tests.");
  await page.getByLabel("Regular price (৳)").fill("20000");
  await page.getByLabel("Discount price (৳, optional)").fill("25000");
  await expect(page.getByText("Shown on the website as")).toBeVisible();
  await page.getByRole("button", { name: "Save and add photos" }).click();
  // Server validation: the discount must be lower; the form keeps what was typed.
  await expect(page.getByText(/must be lower than the regular price/).first()).toBeVisible();
  await expect(page.getByLabel("Title", { exact: true })).toHaveValue("E2E Walnut Bench");

  await page.getByLabel("Discount price (৳, optional)").fill("18000");
  await page.getByRole("button", { name: "Add colour" }).click();
  await page.getByLabel("Name of colour 1").fill("Walnut");
  await page.getByRole("button", { name: "Frame" }).click(); // Sofa preset
  await page.getByLabel("Value of “Frame”").fill("Solid walnut");
  await page.getByRole("button", { name: "Save and add photos" }).click();
  await expect(page).toHaveURL(/\/admin\/products\/\d+$/);
  await expect(page.getByRole("heading", { name: "Photos" })).toBeVisible();
  await expect(shown(page.getByLabel("Name of colour “Walnut”"))).toHaveValue("Walnut");

  // A draft isn't public.
  const editUrl = page.url();
  await page.goto("/products/e2e-walnut-bench");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("We couldn't find that page");
  // …but the signed-in admin can preview it (F1.2), marked noindex.
  await page.goto("/products/e2e-walnut-bench?preview=1");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("E2E Walnut Bench");
  await expect(page.getByText("Only you can see this")).toBeVisible();
  await expect(page.locator('meta[name="robots"][content*="noindex"]').first()).toBeAttached();
  // Anyone else gets not-found, even with ?preview=1.
  const visitor = await newPage(browser);
  await visitor.goto("/products/e2e-walnut-bench?preview=1");
  await expect(visitor.getByRole("heading", { level: 1 })).toHaveText("We couldn't find that page");
  await visitor.context().close();

  await page.goto(editUrl);
  await page.waitForLoadState("networkidle");
  await page.getByLabel("Status").selectOption("PUBLISHED");
  await page.getByRole("button", { name: "Save product" }).click();
  await expect(page.getByText("Product saved.").first()).toBeVisible();
  await page.goto("/products/e2e-walnut-bench");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("E2E Walnut Bench");
  await expect(page.getByText("Solid walnut")).toBeVisible();

  // Filter the list, duplicate, then delete both.
  await page.goto("/admin/products?q=E2E+Walnut");
  await page.getByRole("button", { name: "Duplicate “E2E Walnut Bench”" }).click();
  await expect(page).toHaveURL(/\/admin\/products\/\d+$/);
  await expect(shown(page.getByLabel("Title", { exact: true }))).toHaveValue(
    "E2E Walnut Bench (copy)",
  );
  await expect(shown(page.getByLabel("Status"))).toHaveValue("DRAFT");

  await page.goto("/admin/products?q=E2E+Walnut");
  for (const title of ["E2E Walnut Bench (copy)", "E2E Walnut Bench"]) {
    const row = page.getByRole("listitem").filter({ hasText: title }).first();
    await row.getByRole("button", { name: "Delete" }).click();
    await page.getByRole("dialog").getByRole("button", { name: "Delete" }).click();
    await expect(page.getByText("Product deleted.").first()).toBeVisible();
  }
  await expect(page.getByText("No products match these filters.")).toBeVisible();
});

// --- Milestone 7e: Journal. Creates a throwaway post on the CI database and removes it. --------

test("journal: write a draft, publish it, then delete it", async ({ page }) => {
  await signIn(page, EMAIL!, NEW_PASSWORD);
  await expect(page).toHaveURL(/\/admin$/);

  await page.goto("/admin/blog/new");
  await page.waitForLoadState("networkidle");
  await page.getByLabel("Title", { exact: true }).fill("E2E Caring for Rattan");
  await page.getByLabel("Excerpt").fill("A short e2e post.");
  await page.getByLabel("Content", { exact: true }).fill("## Dust weekly\n\nUse a soft brush.");
  await expect(page.getByLabel("Author")).not.toHaveValue("");
  await page.getByLabel("Publish date").fill("2999-01-01");
  await page.getByRole("button", { name: "Create post" }).click();
  await expect(page.getByText("The publish date can't be in the future.").first()).toBeVisible();

  await page.getByLabel("Publish date").fill("");
  await page.getByRole("tab", { name: "Preview" }).click();
  await expect(page.getByRole("heading", { name: "Dust weekly" })).toBeVisible();
  await page.getByRole("tab", { name: "Write" }).click();
  await page.getByRole("button", { name: "Create post" }).click();
  await expect(page).toHaveURL(/\/admin\/blog\/\d+$/);

  await page.waitForLoadState("networkidle");
  await shown(page.getByLabel("Status")).selectOption("PUBLISHED");
  await page.getByRole("button", { name: "Save post" }).click();
  await expect(page.getByText("Post saved.").first()).toBeVisible();

  await page.goto("/blog/e2e-caring-for-rattan");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("E2E Caring for Rattan");

  await page.goto("/admin/blog?q=E2E+Caring");
  await page.getByRole("button", { name: "Delete" }).first().click();
  await page.getByRole("dialog").getByRole("button", { name: "Delete" }).click();
  await expect(page.getByText("Post deleted.").first()).toBeVisible();
  await expect(page.getByText("No posts match these filters.")).toBeVisible();
});
