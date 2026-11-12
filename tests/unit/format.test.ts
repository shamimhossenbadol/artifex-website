import { describe, expect, it } from "vitest";
import { formatBDT, getPriceInfo } from "@/lib/format";

describe("formatBDT", () => {
  it("uses lakh grouping with the Taka sign", () => {
    expect(formatBDT(125000)).toBe("৳ 1,25,000");
    expect(formatBDT(45500)).toBe("৳ 45,500");
    expect(formatBDT(0)).toBe("৳ 0");
  });
});

describe("getPriceInfo", () => {
  it("returns price on request when there is no regular price", () => {
    expect(getPriceInfo(null, null)).toEqual({ kind: "onRequest" });
    expect(getPriceInfo(null, 1000)).toEqual({ kind: "onRequest" });
  });

  it("returns a regular price", () => {
    expect(getPriceInfo(45500, null)).toEqual({ kind: "regular", price: 45500 });
  });

  it("computes and rounds the discount percentage", () => {
    expect(getPriceInfo(45500, 38675)).toEqual({
      kind: "discounted",
      price: 38675,
      regularPrice: 45500,
      percentOff: 15,
    });
  });

  it("ignores a discount that is not lower than the regular price", () => {
    expect(getPriceInfo(1000, 1000)).toEqual({ kind: "regular", price: 1000 });
    expect(getPriceInfo(1000, 1200)).toEqual({ kind: "regular", price: 1000 });
  });
});
