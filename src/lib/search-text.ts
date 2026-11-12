// Denormalised product search text (04 §4, ADR-007): lowercased title + category + keywords +
// material + colour names, collapsed whitespace, capped at the column size (1000).
export function buildSearchText(parts: {
  title: string;
  categoryName: string;
  keywords?: string | null;
  material?: string | null;
  colorNames?: string[];
}): string {
  return [
    parts.title,
    parts.categoryName,
    parts.keywords,
    parts.material,
    ...(parts.colorNames ?? []),
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase()
    .replace(/[,;|]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 1000);
}

/** Effective price for sorting (ADR-025): the discount when valid, otherwise the regular price. */
export function effectivePrice(
  regularPrice: number | null,
  discountPrice: number | null,
): number | null {
  if (regularPrice === null) return null;
  if (discountPrice !== null && discountPrice >= 0 && discountPrice < regularPrice)
    return discountPrice;
  return regularPrice;
}
