// /api/track (ADR-040): same-origin only, validated, never sets cookies; the site sends a view.
import { expect, test } from "@playwright/test";

test.describe("visit tracking", () => {
  test("accepts a valid same-origin event and rejects the rest", async ({ request, baseURL }) => {
    const origin = new URL(baseURL!).origin;
    const ok = await request.post("/api/track", {
      headers: { Origin: origin, "Content-Type": "text/plain" },
      data: JSON.stringify({ type: "view", path: "/products" }),
    });
    expect(ok.status()).toBe(204);
    expect(ok.headers()["set-cookie"]).toBeUndefined();

    const foreign = await request.post("/api/track", {
      headers: { Origin: "https://evil.example", "Content-Type": "text/plain" },
      data: JSON.stringify({ type: "view", path: "/" }),
    });
    expect(foreign.status()).toBe(403);

    for (const body of [
      "not json",
      JSON.stringify({ type: "purchase", path: "/" }),
      JSON.stringify({ type: "view", path: "https://evil.example/" }),
      JSON.stringify({ type: "view", path: "/a?b=c" }),
    ]) {
      const bad = await request.post("/api/track", {
        headers: { Origin: origin, "Content-Type": "text/plain" },
        data: body,
      });
      expect(bad.status(), body).toBe(400);
    }

    const get = await request.get("/api/track");
    expect(get.status()).toBe(405);
  });

  test("pages send a view beacon, and contact taps send a click", async ({ page }) => {
    const views = page.waitForRequest(
      (r) => r.url().endsWith("/api/track") && r.postData()?.includes('"view"') === true,
    );
    await page.goto("/contact");
    expect(JSON.parse((await views).postData()!)).toEqual({ type: "view", path: "/contact" });

    const link = page
      .locator('a[href^="https://wa.me/"]:not([data-no-track])')
      .filter({ visible: true })
      .first();
    test.skip((await link.count()) === 0, "No WhatsApp number configured on this database");
    // Don't actually leave for WhatsApp.
    await page.context().route("https://wa.me/**", (route) => route.abort());
    const click = page.waitForRequest(
      (r) => r.url().endsWith("/api/track") && r.postData()?.includes('"whatsapp"') === true,
    );
    await link.click({ modifiers: ["ControlOrMeta"] });
    expect(JSON.parse((await click).postData()!)).toEqual({ type: "whatsapp", path: "/contact" });
  });
});
