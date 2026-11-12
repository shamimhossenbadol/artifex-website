import { describe, expect, it } from "vitest";
import { pageWindow } from "@/components/ui/Pagination";
import { safeUrl } from "@/components/ui/Markdown";
import {
  absoluteUrl,
  breadcrumbJsonLd,
  productJsonLd,
  serializeJsonLd,
  type ProductJsonLdInput,
} from "@/lib/seo";

const SITE = "https://artifex.example";
const MEDIA = "https://media.artifex.example";

const product: ProductJsonLdInput = {
  title: "Signature L-Shape Sofa",
  description: "Deep seats and a solid frame.",
  path: "/products/signature-l-shape-sofa",
  sku: "AF-SOFA-01",
  categoryName: "Sofas",
  regularPrice: 145000,
  discountPrice: 125000,
  isMadeToOrder: false,
  imagePaths: ["products/2026/11/ab12cd34ef56"],
};

describe("absoluteUrl", () => {
  it("prefixes the site URL", () => {
    expect(absoluteUrl("/products/x", SITE)).toBe("https://artifex.example/products/x");
  });
  it("keeps absolute URLs", () => {
    expect(absoluteUrl("https://other.example/a", SITE)).toBe("https://other.example/a");
  });
});

describe("productJsonLd", () => {
  it("includes an Offer with the effective BDT price and the 1600px image", () => {
    const ld = productJsonLd(product, SITE, MEDIA);
    expect(ld["@type"]).toBe("Product");
    expect(ld.image).toEqual([
      "https://media.artifex.example/products/2026/11/ab12cd34ef56-1600.webp",
    ]);
    expect(ld.offers).toMatchObject({
      priceCurrency: "BDT",
      price: 125000,
      availability: "https://schema.org/InStock",
      url: "https://artifex.example/products/signature-l-shape-sofa",
    });
  });

  it("uses PreOrder for made-to-order products", () => {
    const ld = productJsonLd({ ...product, isMadeToOrder: true }, SITE, MEDIA);
    expect((ld.offers as { availability: string }).availability).toBe(
      "https://schema.org/PreOrder",
    );
  });

  it("omits the offer when the price is on request", () => {
    const ld = productJsonLd({ ...product, regularPrice: null, discountPrice: null }, SITE, MEDIA);
    expect(ld.offers).toBeUndefined();
  });
});

describe("breadcrumbJsonLd", () => {
  it("numbers items from 1 with absolute URLs", () => {
    const ld = breadcrumbJsonLd(
      [
        { name: "Home", path: "/" },
        { name: "Sofas", path: "/categories/sofas" },
      ],
      SITE,
    );
    expect(ld.itemListElement).toEqual([
      { "@type": "ListItem", position: 1, name: "Home", item: "https://artifex.example/" },
      {
        "@type": "ListItem",
        position: 2,
        name: "Sofas",
        item: "https://artifex.example/categories/sofas",
      },
    ]);
  });
});

describe("serializeJsonLd", () => {
  it("escapes < so the script tag can't be closed early", () => {
    const out = serializeJsonLd({ name: "</script><script>alert(1)</script>" });
    expect(out).not.toContain("</script>");
    expect(JSON.parse(out).name).toBe("</script><script>alert(1)</script>");
  });
});

describe("safeUrl (Markdown links)", () => {
  it.each([
    "https://a.example",
    "http://a.example",
    "mailto:x@y.z",
    "tel:+880",
    "/contact",
    "#top",
  ])("keeps %s", (url) => expect(safeUrl(url)).toBe(url));
  it.each(["javascript:alert(1)", "JAVASCRIPT:alert(1)", "data:text/html,x", "vbscript:x"])(
    "drops %s",
    (url) => expect(safeUrl(url)).toBe(""),
  );
});

describe("pageWindow", () => {
  it("shows all pages when there are few", () => {
    expect(pageWindow(2, 3)).toEqual([1, 2, 3]);
  });
  it("adds gaps around the current page", () => {
    expect(pageWindow(5, 10)).toEqual([1, null, 4, 5, 6, null, 10]);
  });
  it("handles the edges", () => {
    expect(pageWindow(1, 10)).toEqual([1, 2, null, 10]);
    expect(pageWindow(10, 10)).toEqual([1, null, 9, 10]);
  });
});
