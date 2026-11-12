import { describe, expect, it } from "vitest";
import { buildImageUrl, pickVariantWidth } from "@/lib/image-variants";

const MEDIA = "https://media.example.com";

describe("pickVariantWidth", () => {
  it.each([
    [1, 480],
    [480, 480],
    [481, 960],
    [960, 960],
    [1200, 1600],
    [3840, 1600],
  ])("width %i → %i", (width, expected) => {
    expect(pickVariantWidth(width)).toBe(expected);
  });
});

describe("buildImageUrl", () => {
  it("maps an R2 key base to the nearest WebP variant", () => {
    expect(buildImageUrl("products/2026/11/ab12cd34ef56", 640, MEDIA)).toBe(
      "https://media.example.com/products/2026/11/ab12cd34ef56-960.webp",
    );
  });

  it("passes local /public paths through unchanged", () => {
    expect(buildImageUrl("/logo.svg", 640, MEDIA)).toBe("/logo.svg");
  });

  it("passes absolute URLs through unchanged", () => {
    expect(buildImageUrl("https://cdn.example.com/a.webp", 640, MEDIA)).toBe(
      "https://cdn.example.com/a.webp",
    );
  });
});
