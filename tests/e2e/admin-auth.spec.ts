import { expect, test, type Browser, type Page } from "@playwright/test";

// Admin authentication (07 §1, 09 §2, TESTING §4). These tests CHANGE the admin password, so they
// only run when E2E_ADMIN_EMAIL / E2E_ADMIN_PASSWORD are set: in CI, against the throwaway CI DB.
// Never set them when pointing at a real database.
const EMAIL = process.env.E2E_ADMIN_EMAIL;
const INITIAL = process.env.E2E_ADMIN_PASSWORD;
const NEW_PASSWORD = "Walnut-Sofa-Testing-2026";

test.describe.configure({ mode: "serial" });
test.skip(!EMAIL || !INITIAL, "admin e2e only runs in CI (E2E_ADMIN_EMAIL/PASSWORD)");
test.skip(({ isMobile }) => isMobile, "runs once, on the desktop project");

async function signIn(page: Page, email: string, password: string) {
  await page.goto("/admin/login");
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

test("too many failures lock the email out", async ({ page }) => {
  const victim = "nobody-lockout@example.com";
  for (let i = 0; i < 5; i++) {
    await signIn(page, victim, `wrong-${i}`);
    await expect(page.getByText("Invalid email or password.")).toBeVisible();
  }
  await signIn(page, victim, "wrong-again");
  await expect(page.getByText(/Too many attempts/)).toBeVisible();
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
