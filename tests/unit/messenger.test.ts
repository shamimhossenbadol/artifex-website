import { describe, expect, it } from "vitest";
import { toMessengerUrl } from "@/lib/messenger";

describe("toMessengerUrl", () => {
  it("maps a page username to m.me", () => {
    expect(toMessengerUrl("https://www.facebook.com/artifexfurniturebd")).toBe(
      "https://m.me/artifexfurniturebd",
    );
    expect(toMessengerUrl("https://facebook.com/artifexfurniturebd/?ref=x")).toBe(
      "https://m.me/artifexfurniturebd",
    );
    expect(toMessengerUrl("https://m.facebook.com/artifex.furniture")).toBe(
      "https://m.me/artifex.furniture",
    );
  });

  it("maps profile.php ids", () => {
    expect(toMessengerUrl("https://www.facebook.com/profile.php?id=61550000000000")).toBe(
      "https://m.me/61550000000000",
    );
  });

  it("falls back to the page URL when it can't be mapped", () => {
    const groups = "https://www.facebook.com/groups/12345";
    expect(toMessengerUrl(groups)).toBe(groups);
    const nested = "https://www.facebook.com/artifex/photos";
    expect(toMessengerUrl(nested)).toBe(nested);
    const other = "https://fb.me/artifex";
    expect(toMessengerUrl(other)).toBe(other);
  });

  it("returns null for missing, invalid or non-https URLs", () => {
    expect(toMessengerUrl(null)).toBeNull();
    expect(toMessengerUrl("")).toBeNull();
    expect(toMessengerUrl("not a url")).toBeNull();
    expect(toMessengerUrl("http://www.facebook.com/artifex")).toBeNull();
    expect(toMessengerUrl("javascript:alert(1)")).toBeNull();
  });
});
