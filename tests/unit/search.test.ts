import { describe, expect, it } from "vitest";
import {
  escapeLike,
  isSearchable,
  matchTier,
  normalizeQuery,
  rankProducts,
  splitTerms,
} from "@/lib/search";
import { searchPageSchema, searchQuerySchema } from "@/lib/validation/search";

describe("normalizeQuery", () => {
  it("lowercases, trims and collapses whitespace", () => {
    expect(normalizeQuery("  Walnut   BED \n")).toBe("walnut bed");
  });
  it("caps at 60 characters", () => {
    expect(normalizeQuery("a".repeat(100))).toHaveLength(60);
  });
  it("keeps Bangla text", () => {
    expect(normalizeQuery(" সোফা ")).toBe("সোফা");
  });
});

describe("splitTerms", () => {
  it("returns up to 5 distinct terms", () => {
    expect(splitTerms("a b a c d e f g")).toEqual(["a", "b", "c", "d", "e"]);
  });
});

describe("escapeLike", () => {
  it("escapes %, _ and backslash so they match literally", () => {
    expect(escapeLike("50%_off\\")).toBe("50\\%\\_off\\\\");
  });
  it("leaves normal text alone", () => {
    expect(escapeLike("walnut")).toBe("walnut");
  });
});

describe("isSearchable", () => {
  it("needs at least 2 characters", () => {
    expect(isSearchable("")).toBe(false);
    expect(isSearchable("a")).toBe(false);
    expect(isSearchable("ab")).toBe(true);
  });
});

describe("ranking", () => {
  const d = (n: number) => new Date(Date.UTC(2026, 0, n));
  const rows = [
    { title: "Haven Bed with Sofa Cushions", isPopular: false, publishedAt: d(5) },
    { title: "Classic Sofa Set", isPopular: false, publishedAt: d(3) },
    { title: "Sofa Bed Compact", isPopular: false, publishedAt: d(1) },
    { title: "Lounge Chair", isPopular: true, publishedAt: d(9) }, // matched via other fields
    { title: "Sofa Grande", isPopular: true, publishedAt: d(2) },
  ];

  it("puts title prefix first, then title contains, then other matches", () => {
    expect(rankProducts(rows, "sofa").map((r) => r.title)).toEqual([
      "Sofa Grande", // prefix + popular
      "Sofa Bed Compact", // prefix
      "Haven Bed with Sofa Cushions", // contains, newer
      "Classic Sofa Set", // contains, older
      "Lounge Chair", // other
    ]);
  });

  it("classifies match tiers", () => {
    expect(matchTier("Sofa Grande", "sofa")).toBe(0);
    expect(matchTier("Classic Sofa", "sofa")).toBe(1);
    expect(matchTier("Lounge Chair", "sofa")).toBe(2);
  });
});

describe("search schemas", () => {
  it("accepts 2–60 characters for the API", () => {
    expect(searchQuerySchema.safeParse({ q: " so " }).success).toBe(true);
    expect(searchQuerySchema.safeParse({ q: "s" }).success).toBe(false);
    expect(searchQuerySchema.safeParse({ q: "x".repeat(61) }).success).toBe(false);
    expect(searchQuerySchema.safeParse({}).success).toBe(false);
  });

  it("parses the results page params", () => {
    expect(searchPageSchema.parse({ q: "sofa", page: "2" })).toEqual({ q: "sofa", page: 2 });
    expect(searchPageSchema.parse({})).toEqual({ q: undefined, page: 1 });
    expect(searchPageSchema.safeParse({ page: "0" }).success).toBe(false);
  });
});
