// Display formatting for prices and dates (F1.3, 11 §6).

const bdtFormatter = new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 });

/** `৳ 1,25,000` (lakh grouping, as used in Bangladesh). Prices are whole Taka integers. */
export function formatBDT(amount: number): string {
  return `৳ ${bdtFormatter.format(Math.round(amount))}`;
}

export type PriceInfo =
  | { kind: "onRequest" }
  | { kind: "regular"; price: number }
  | { kind: "discounted"; price: number; regularPrice: number; percentOff: number };

/**
 * Normalises the stored prices into what the UI shows (F1.3, 04 §4). An invalid discount
 * (not lower than the regular price, or without one) is ignored rather than shown.
 */
export function getPriceInfo(regularPrice: number | null, discountPrice: number | null): PriceInfo {
  if (regularPrice === null) return { kind: "onRequest" };
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
