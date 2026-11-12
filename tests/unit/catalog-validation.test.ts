import { describe, expect, it } from "vitest";
import { listingHref, parseListingQuery, slugSchema } from "@/lib/validation/catalog";

describe("parseListingQuery", () => {
  it("uses defaults for an empty query", () => {
    expect(parseListingQuery({})).toEqual({ page: 1, sort: "newest", onSale: false });
  });

  it("reads page, sort and sale", () => {
    expect(parseListingQuery({ page: "3", sort: "price_asc", sale: "1" })).toEqual({
      page: 3,
      sort: "price_asc",
      onSale: true,
    });
  });

  it("uses the first value of repeated params", () => {
    expect(parseListingQuery({ page: ["2", "9"] })?.page).toBe(2);
  });

  it("ignores unknown sort and sale values", () => {
    expect(parseListingQuery({ sort: "cheapest", sale: "yes" })).toEqual({
      page: 1,
      sort: "newest",
      onSale: false,
    });
  });

  it.each(["0", "-1", "abc", "1.5", "99999"])("rejects page %s", (page) => {
    expect(parseListingQuery({ page })).toBeNull();
  });
});

describe("listingHref", () => {
  it("omits defaults so page 1 is the canonical URL", () => {
    expect(listingHref("/products", { page: 1, sort: "newest", onSale: false })).toBe("/products");
  });

  it("keeps sort, sale and page", () => {
    expect(listingHref("/categories/sofas", { page: 2, sort: "price_desc", onSale: true })).toBe(
      "/categories/sofas?sort=price_desc&sale=1&page=2",
    );
  });
});

describe("slugSchema", () => {
  it.each(["sofas", "dining-tables", "milano-3-seater"])("accepts %s", (slug) => {
    expect(slugSchema.safeParse(slug).success).toBe(true);
  });

  it.each(["Sofas", "dining_tables", "-sofa", "sofa-", "a--b", "../etc", ""])(
    "rejects %s",
    (slug) => {
      expect(slugSchema.safeParse(slug).success).toBe(false);
    },
  );
});
