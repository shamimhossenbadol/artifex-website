// Zod schemas for catalogue URLs (09 §3): slugs and listing search params.
import { z } from "zod";

export const PRODUCTS_PER_PAGE = 24;
export const SORT_OPTIONS = ["newest", "price_asc", "price_desc"] as const;
export type ProductSort = (typeof SORT_OPTIONS)[number];

export const slugSchema = z
  .string()
  .max(170)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);

/** Next.js gives each search param as string | string[] | undefined; use the first value. */
const firstValue = (v: unknown) => (Array.isArray(v) ? v[0] : v);

export const listingQuerySchema = z.object({
  page: z.preprocess(firstValue, z.coerce.number().int().min(1).max(10_000).optional().default(1)),
  sort: z.preprocess(firstValue, z.enum(SORT_OPTIONS).optional().catch(undefined)),
  sale: z.preprocess(firstValue, z.literal("1").optional().catch(undefined)),
});

export type ListingQuery = {
  page: number;
  sort: ProductSort;
  onSale: boolean;
};

/**
 * Parses listing search params. Unknown sort/sale values fall back to defaults; an invalid page
 * number returns null so the page can 404 (F1.1).
 */
export function parseListingQuery(
  searchParams: Record<string, string | string[] | undefined>,
): ListingQuery | null {
  const result = listingQuerySchema.safeParse(searchParams);
  if (!result.success) return null;
  return {
    page: result.data.page,
    sort: result.data.sort ?? "newest",
    onSale: result.data.sale === "1",
  };
}

/** Builds a listing URL; defaults are omitted so canonical URLs stay clean (08 §1). */
export function listingHref(
  basePath: string,
  { page = 1, sort = "newest", onSale = false }: Partial<ListingQuery>,
): string {
  const params = new URLSearchParams();
  if (sort !== "newest") params.set("sort", sort);
  if (onSale) params.set("sale", "1");
  if (page > 1) params.set("page", String(page));
  const query = params.toString();
  return query ? `${basePath}?${query}` : basePath;
}
