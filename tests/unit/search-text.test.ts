import { describe, expect, it } from "vitest";
import { buildSearchText, effectivePrice } from "@/lib/search-text";

describe("buildSearchText", () => {
  it("joins and lowercases title, category, keywords, material and colours", () => {
    expect(
      buildSearchText({
        title: "Milano  Sofa",
        categoryName: "Sofas",
        keywords: "couch, settee",
        material: "Teak",
        colorNames: ["Walnut Brown"],
      }),
    ).toBe("milano sofa sofas couch settee teak walnut brown");
  });

  it("skips empty parts and caps the length at 1000", () => {
    expect(buildSearchText({ title: "A", categoryName: "B", keywords: null })).toBe("a b");
    expect(buildSearchText({ title: "x".repeat(2000), categoryName: "b" })).toHaveLength(1000);
  });
});

describe("effectivePrice", () => {
  it("uses a valid discount", () => expect(effectivePrice(1000, 800)).toBe(800));
  it("ignores an invalid discount", () => expect(effectivePrice(1000, 1200)).toBe(1000));
  it("is null for price on request", () => expect(effectivePrice(null, 500)).toBeNull());
});
