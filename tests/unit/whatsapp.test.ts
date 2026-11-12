import { describe, expect, it } from "vitest";
import { buildProductMessage, buildWhatsAppUrl, sanitizeWhatsAppNumber } from "@/lib/whatsapp";
import { toTelHref } from "@/lib/phone";

const TEMPLATE =
  "Hello {business}, I'm interested in {product}{color}. Could you share more details?\n{url}";

describe("sanitizeWhatsAppNumber", () => {
  it("keeps digits only", () => {
    expect(sanitizeWhatsAppNumber("+880 1757-758388")).toBe("8801757758388");
  });
});

describe("buildWhatsAppUrl", () => {
  it("builds a wa.me link without a message", () => {
    expect(buildWhatsAppUrl({ number: "8801757758388" })).toBe("https://wa.me/8801757758388");
  });

  it("encodes special characters, emoji and Bangla", () => {
    const url = buildWhatsAppUrl({ number: "8801757758388", message: "Sofa & table #1? 🛋️ সোফা" });
    expect(url.startsWith("https://wa.me/8801757758388?text=")).toBe(true);
    const text = new URL(url).searchParams.get("text");
    expect(text).toBe("Sofa & table #1? 🛋️ সোফা");
    expect(url).not.toContain("&table");
    expect(url).not.toContain("#");
  });
});

describe("buildProductMessage", () => {
  const base = {
    template: TEMPLATE,
    business: "Artifex Furniture",
    product: "Signature L-Shape Sofa",
    url: "https://artifex.example/products/signature-l-shape-sofa",
  };

  it("includes the colour when one is selected", () => {
    expect(buildProductMessage({ ...base, color: "Walnut Brown" })).toBe(
      "Hello Artifex Furniture, I'm interested in Signature L-Shape Sofa (Colour: Walnut Brown). Could you share more details?\nhttps://artifex.example/products/signature-l-shape-sofa",
    );
  });

  it("omits the colour placeholder when none is selected", () => {
    expect(buildProductMessage(base)).toContain("Signature L-Shape Sofa. Could");
  });

  it("leaves unknown placeholders untouched", () => {
    expect(buildProductMessage({ ...base, template: "{product} {unknown}" })).toBe(
      "Signature L-Shape Sofa {unknown}",
    );
  });
});

describe("toTelHref", () => {
  it("keeps the leading plus and digits", () => {
    expect(toTelHref("+880 1757-758388")).toBe("tel:+8801757758388");
    expect(toTelHref("01757-758388")).toBe("tel:01757758388");
  });
});
