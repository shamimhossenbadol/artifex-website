// Zod schemas for the admin product form and list (07 §3.2).
import { z } from "zod";
import { slugify } from "./category";
import { optionalText, requiredText } from "./settings";

export const PRODUCT_SLUG_MAX = 170;
/** One main photo (cards, listings, sharing) + up to 4 gallery photos for the product page (ADR-041). */
export const MAX_PRODUCT_IMAGES = 5;
export const MAX_SPECS = 40;
export const ADMIN_PRODUCTS_PER_PAGE = 20;
const MAX_PRICE = 100_000_000;
/** How a product's price is shown (ADR-076). */
export const PRICE_TYPES = ["fixed", "range", "quote"] as const;
export type PriceType = (typeof PRICE_TYPES)[number];

/** The price type a saved product was entered with. */
export function initialPriceType(p: {
  regularPrice: number | null;
  maxPrice: number | null;
}): PriceType {
  if (p.regularPrice === null) return "quote";
  return p.maxPrice !== null ? "range" : "fixed";
}

const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

const checkbox = z
  .string()
  .optional()
  .transform((v) => v === "on");

/** Whole Taka; blank → null. Accepts "45,500" and "৳ 45 500". */
const optionalPrice = z
  .string()
  .trim()
  .transform((v) => v.replace(/[৳,\s]/g, ""))
  .refine((v) => v === "" || /^\d+$/.test(v), "Use whole Taka, numbers only")
  .transform((v) => (v === "" ? null : Number(v)))
  .refine((v) => v === null || v <= MAX_PRICE, "That price is too high");

/** A JSON array sent from a repeatable-rows editor in a hidden input. */
function jsonArray<T extends z.ZodType>(item: T, max: number, label: string) {
  return z
    .string()
    .transform((value, ctx) => {
      try {
        return JSON.parse(value === "" ? "[]" : value) as unknown;
      } catch {
        ctx.addIssue({ code: "custom", message: `The ${label} list couldn't be read` });
        return z.NEVER;
      }
    })
    .pipe(z.array(item).max(max, `Up to ${max} ${label}`));
}

export const specSchema = z.object({
  label: z.string().trim().min(1, "Add a label").max(60, "Keep this under 60 characters"),
  value: z.string().trim().min(1, "Add a value").max(255, "Keep this under 255 characters"),
});

/** Status shortcut on the product list (ADR-056). */
export const productStatusSchema = z.enum(["DRAFT", "PUBLISHED"]);

export const productSchema = z
  .object({
    title: requiredText(150, "Title"),
    slug: z.string().trim().max(PRODUCT_SLUG_MAX, `Keep this under ${PRODUCT_SLUG_MAX} characters`),
    categoryId: z.coerce.number({ error: "Choose a category" }).int().positive("Choose a category"),
    // The SEO description (ADR-060): Google and link previews only, not shown on the product page.
    shortDescription: requiredText(300, "SEO description"),
    description: z.string().trim().max(20_000, "Keep this under 20,000 characters"),
    // ADR-076: fixed price (optional discount), a price range, or no price (custom quote).
    priceType: z.enum(PRICE_TYPES, { error: "Choose how the price is shown" }).default("fixed"),
    regularPrice: optionalPrice,
    discountPrice: optionalPrice,
    maxPrice: optionalPrice.optional().transform((v) => v ?? null),
    specs: jsonArray(specSchema, MAX_SPECS, "specifications"),
    isMadeToOrder: checkbox,
    keywords: optionalText(255),
    status: z.enum(["DRAFT", "PUBLISHED"], { error: "Choose Draft or Published" }),
    isPopular: checkbox,
    isNewArrival: checkbox,
    seoTitle: optionalText(70),
  })
  .superRefine((v, ctx) => {
    if (v.priceType === "range") {
      if (v.regularPrice === null) {
        ctx.addIssue({ code: "custom", message: "Add the lowest price", path: ["regularPrice"] });
      }
      if (v.maxPrice === null) {
        ctx.addIssue({ code: "custom", message: "Add the highest price", path: ["maxPrice"] });
      } else if (v.regularPrice !== null && v.maxPrice <= v.regularPrice) {
        ctx.addIssue({
          code: "custom",
          message: "The highest price must be above the lowest price",
          path: ["maxPrice"],
        });
      }
    }
  })
  // Keep only the fields that belong to the chosen price type.
  .transform(({ slug, priceType, regularPrice, discountPrice, maxPrice, ...rest }) => ({
    ...rest,
    regularPrice: priceType === "quote" ? null : regularPrice,
    discountPrice: priceType === "fixed" ? discountPrice : null,
    maxPrice: priceType === "range" ? maxPrice : null,
    slug: slugify(slug || rest.title, PRODUCT_SLUG_MAX),
  }))
  .refine((v) => SLUG_PATTERN.test(v.slug), {
    message: "Use letters or numbers in the title or web address",
    path: ["slug"],
  })
  .refine((v) => v.discountPrice === null || v.regularPrice !== null, {
    message: "Add a regular price before a discount price",
    path: ["discountPrice"],
  })
  .refine(
    (v) => v.discountPrice === null || v.regularPrice === null || v.discountPrice < v.regularPrice,
    { message: "The discount price must be lower than the regular price", path: ["discountPrice"] },
  );

export type ProductInput = z.infer<typeof productSchema>;

export const imageAltSchema = requiredText(160, "Image description");

// --- List filters (search params) --------------------------------------------------------------

export const ADMIN_PRODUCT_SORTS = ["updated", "title", "price_asc", "price_desc"] as const;
export const ADMIN_PRODUCT_FLAGS = ["popular", "new", "sale", "no-images"] as const;
export type AdminProductSort = (typeof ADMIN_PRODUCT_SORTS)[number];
export type AdminProductFlag = (typeof ADMIN_PRODUCT_FLAGS)[number];

const firstValue = (v: unknown) => (Array.isArray(v) ? v[0] : v);

/** Invalid values fall back to "no filter" instead of erroring. */
export const adminProductQuerySchema = z.object({
  q: z.preprocess(
    firstValue,
    z
      .string()
      .trim()
      .max(60)
      .optional()
      .catch(undefined)
      .transform((v) => v || undefined),
  ),
  category: z.preprocess(
    firstValue,
    z.string().regex(SLUG_PATTERN).max(100).optional().catch(undefined),
  ),
  status: z.preprocess(firstValue, z.enum(["DRAFT", "PUBLISHED"]).optional().catch(undefined)),
  flag: z.preprocess(firstValue, z.enum(ADMIN_PRODUCT_FLAGS).optional().catch(undefined)),
  sort: z.preprocess(firstValue, z.enum(ADMIN_PRODUCT_SORTS).optional().catch(undefined)),
  page: z.preprocess(firstValue, z.coerce.number().int().min(1).max(10_000).catch(1).default(1)),
});

export type AdminProductQuery = z.infer<typeof adminProductQuerySchema>;
