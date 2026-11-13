// First-party analytics and the Pixel ID setting (ADR-040).
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  classifyContactLink,
  isBotUserAgent,
  percentChange,
  productSlugFromPath,
} from "@/lib/analytics";
import { analyticsRangeSchema, trackEventSchema } from "@/lib/validation/analytics";
import { settingsFormSchema } from "@/lib/validation/settings";

const repo = vi.hoisted(() => ({
  insertSiteEvent: vi.fn(),
  deleteSiteEventsBefore: vi.fn(),
  countEventsByType: vi.fn(),
  countEvents: vi.fn(),
  countVisitors: vi.fn(),
  findTopPaths: vi.fn(),
  findProductTitlesBySlug: vi.fn(),
}));
vi.mock("next/server", () => ({ connection: async () => undefined }));
vi.mock("@/server/repositories/analytics.repo", () => repo);
vi.mock("@/lib/env", () => ({ serverEnv: () => ({ AUTH_SECRET: "x".repeat(40) }) }));

const { getAnalyticsSummary, recordEvent, visitorHash } =
  await import("@/server/services/analytics.service");

const CHROME =
  "Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0 Mobile Safari/537.36";

describe("contact link classification", () => {
  it.each([
    ["https://wa.me/8801712345678?text=Hi", "whatsapp"],
    ["https://api.whatsapp.com/send?phone=880", "whatsapp"],
    ["https://m.me/artifexfurniture", "messenger"],
    ["https://www.messenger.com/t/123", "messenger"],
    ["tel:+8801712345678", "call"],
    ["https://facebook.com/artifex", null],
    ["/products", null],
    ["mailto:hi@example.com", null],
    ["javascript:alert(1)", null],
  ])("%s → %s", (href, expected) => {
    expect(classifyContactLink(href)).toBe(expected);
  });
});

describe("event validation", () => {
  it("accepts known types and plain paths only", () => {
    expect(trackEventSchema.safeParse({ type: "view", path: "/products/oak-sofa" }).success).toBe(
      true,
    );
    for (const path of [
      "products",
      "//evil.example",
      "/a?b=1",
      "/a#x",
      "/ä",
      "/" + "a".repeat(300),
    ]) {
      expect(trackEventSchema.safeParse({ type: "view", path }).success, path).toBe(false);
    }
    expect(trackEventSchema.safeParse({ type: "purchase", path: "/" }).success).toBe(false);
  });

  it("falls back to 30 days for unknown periods", () => {
    expect(analyticsRangeSchema.parse("7")).toBe(7);
    expect(analyticsRangeSchema.parse("90")).toBe(90);
    expect(analyticsRangeSchema.parse("365")).toBe(30);
    expect(analyticsRangeSchema.parse(undefined)).toBe(30);
  });

  it("recognises bots and missing user agents", () => {
    expect(isBotUserAgent(CHROME)).toBe(false);
    expect(isBotUserAgent("Googlebot/2.1")).toBe(true);
    expect(isBotUserAgent("facebookexternalhit/1.1")).toBe(true);
    expect(isBotUserAgent("Mozilla/5.0 HeadlessChrome/131")).toBe(true);
    expect(isBotUserAgent(null)).toBe(true);
  });

  it("helpers: product slugs and percent change", () => {
    expect(productSlugFromPath("/products/oak-sofa")).toBe("oak-sofa");
    expect(productSlugFromPath("/products")).toBeNull();
    expect(productSlugFromPath("/categories/sofas")).toBeNull();
    expect(percentChange(150, 100)).toBe(50);
    expect(percentChange(50, 100)).toBe(-50);
    expect(percentChange(5, 0)).toBeNull();
  });
});

describe("Pixel ID setting", () => {
  const parse = (facebookPixelId: string) =>
    settingsFormSchema.safeParse({ section: "tracking", facebookPixelId });

  it("stores digits only, ignoring spaces; empty turns it off", () => {
    expect(parse(" 1234 5678 9012 345 ")).toMatchObject({
      success: true,
      data: { facebookPixelId: "123456789012345" },
    });
    expect(parse("")).toMatchObject({ success: true, data: { facebookPixelId: null } });
  });

  it("rejects pasted code and anything that isn't an ID", () => {
    for (const value of ["<script>fbq('init','1')</script>", "12345", "abc123456789012"]) {
      expect(parse(value).success, value).toBe(false);
    }
  });
});

describe("recording", () => {
  beforeEach(() => vi.resetAllMocks());

  it("hashes the visitor per day without storing the IP", async () => {
    const day1 = new Date("2026-11-13T10:00:00Z");
    const day2 = new Date("2026-11-14T10:00:00Z");
    const a = visitorHash("203.0.113.5", CHROME, day1, "s".repeat(40));
    expect(a).toMatch(/^[0-9a-f]{16}$/);
    expect(visitorHash("203.0.113.5", CHROME, day1, "s".repeat(40))).toBe(a);
    expect(visitorHash("203.0.113.5", CHROME, day2, "s".repeat(40))).not.toBe(a);
    expect(visitorHash("203.0.113.6", CHROME, day1, "s".repeat(40))).not.toBe(a);

    expect(
      await recordEvent(
        { type: "view", path: "/" },
        { ip: "203.0.113.5", userAgent: CHROME, now: day1 },
      ),
    ).toBe(true);
    const saved = repo.insertSiteEvent.mock.calls[0]?.[0];
    expect(saved).toMatchObject({ type: "view", path: "/" });
    expect(JSON.stringify(saved)).not.toContain("203.0.113.5");
  });

  it("ignores bots", async () => {
    expect(
      await recordEvent({ type: "view", path: "/" }, { ip: "1.1.1.1", userAgent: "Googlebot" }),
    ).toBe(false);
    expect(repo.insertSiteEvent).not.toHaveBeenCalled();
  });
});

describe("dashboard summary", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    // First call = current period, second = previous period.
    repo.countEventsByType
      .mockResolvedValueOnce([
        { type: "view", count: 200 },
        { type: "whatsapp", count: 8 },
        { type: "call", count: 2 },
      ])
      .mockResolvedValueOnce([
        { type: "view", count: 100 },
        { type: "whatsapp", count: 10 },
      ]);
    repo.countVisitors.mockResolvedValueOnce(50).mockResolvedValueOnce(0);
    repo.countEvents.mockResolvedValueOnce(120).mockResolvedValueOnce(60);
    repo.findTopPaths.mockImplementation(
      async (types: string[], _r: unknown, o: { prefix?: string }) =>
        o.prefix
          ? [
              { path: "/products/oak-sofa", count: types.includes("view") ? 40 : 6 },
              { path: "/products/gone-chair", count: 3 },
            ]
          : [{ path: "/", count: 90 }],
    );
    repo.findProductTitlesBySlug.mockResolvedValue([
      { id: 7, slug: "oak-sofa", title: "Oak Sofa" },
    ]);
  });

  it("computes KPIs, changes and ranked lists", async () => {
    const s = await getAnalyticsSummary(30, new Date("2026-11-13T00:00:00Z"));
    expect(s.pageViews).toEqual({ value: 200, previous: 100, change: 100 });
    expect(s.visitors).toEqual({ value: 50, previous: 0, change: null });
    expect(s.productViews.change).toBe(100);
    expect(s.whatsapp.change).toBe(-20);
    expect(s.inquiries).toMatchObject({ value: 10, previous: 10, change: 0 });
    expect(s.inquiryRate).toBe(20);
    expect(s.topViewedProducts[0]).toEqual({
      label: "Oak Sofa",
      href: "/admin/products/7",
      count: 40,
    });
    // A product that no longer exists keeps its slug, without a link.
    expect(s.topViewedProducts[1]).toEqual({ label: "gone-chair", href: null, count: 3 });
    expect(s.topPages).toEqual([{ label: "/", href: "/", count: 90 }]);
  });
});
