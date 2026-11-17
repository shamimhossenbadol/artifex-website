// Display formatting for prices and dates (F1.3, 11 §6).

const bdtFormatter = new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 });

/** `৳ 1,25,000` (lakh grouping, as used in Bangladesh). Prices are whole Taka integers. */
export function formatBDT(amount: number): string {
  return `৳ ${bdtFormatter.format(Math.round(amount))}`;
}

export type PriceInfo =
  | { kind: "onRequest" }
  | { kind: "regular"; price: number }
  | { kind: "discounted"; price: number; regularPrice: number; percentOff: number }
  | { kind: "range"; min: number; max: number };

/**
 * Normalises the stored prices into what the UI shows (F1.3, 04 §4). An invalid discount
 * (not lower than the regular price, or without one) is ignored rather than shown. A max price
 * above the regular price makes it a range (ADR-076); a range never shows a discount.
 */
export function getPriceInfo(
  regularPrice: number | null,
  discountPrice: number | null,
  maxPrice: number | null = null,
): PriceInfo {
  if (regularPrice === null) return { kind: "onRequest" };
  if (maxPrice !== null && maxPrice > regularPrice) {
    return { kind: "range", min: regularPrice, max: maxPrice };
  }
  if (discountPrice !== null && discountPrice >= 0 && discountPrice < regularPrice) {
    return {
      kind: "discounted",
      price: discountPrice,
      regularPrice,
      percentOff: Math.round((1 - discountPrice / regularPrice) * 100),
    };
  }
  return { kind: "regular", price: regularPrice };
}

/** `৳ 40,000 – ৳ 60,000` (ADR-076). */
export function formatBDTRange(min: number, max: number): string {
  return `${formatBDT(min)} – ${formatBDT(max)}`;
}

/** One-line price text (mobile sticky bar, WhatsApp {price}); null when there is no price. */
export function priceText(info: PriceInfo): string | null {
  if (info.kind === "onRequest") return null;
  if (info.kind === "range") return formatBDTRange(info.min, info.max);
  return formatBDT(info.price);
}

/** The lowest price shown (Pixel value, sorting); null when there is no price. */
export function lowestPrice(info: PriceInfo): number | null {
  if (info.kind === "onRequest") return null;
  return info.kind === "range" ? info.min : info.price;
}
