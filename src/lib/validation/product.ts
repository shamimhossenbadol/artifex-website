// Zod schemas for the admin product form and list (07 §3.2).
import { z } from "zod";
import { slugify } from "./category";
import { optionalText, requiredText } from "./settings";

export const PRODUCT_SLUG_MAX = 170;
/** One main photo (cards, listings, sharing) + up to 4 gallery photos for the product page (ADR-041). */
export const MAX_PRODUCT_IMAGES = 5;
export const MAX_COLORS = 20;
export const MAX_SPECS = 40;
export const ADMIN_PRODUCTS_PER_PAGE = 20;
const MAX_PRICE = 100_000_000;

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

export const colorSchema = z.object({
  name: z.string().trim().min(1, "Name the colour").max(50, "Keep this under 50 characters"),
  hex: z
    .string()
    .trim()
    .regex(/^#[0-9a-fA-F]{6}$/, "Use a colour like #5C4033")
    .transform((v) => v.toUpperCase()),
});

export const specSchema = z.object({
  label: z.string().trim().min(1, "Add a label").max(60, "Keep this under 60 characters"),
  value: z.string().trim().min(1, "Add a value").max(255, "Keep this under 255 characters"),
});

export type ColorInput = z.infer<typeof colorSchema>;
export type SpecInput = z.infer<typeof specSchema>;

export const productSchema = z
  .object({
    title: requiredText(150, "Title"),
    slug: z.string().trim().max(PRODUCT_SLUG_MAX, `Keep this under ${PRODUCT_SLUG_MAX} characters`),
    categoryId: z.coerce.number({ error: "Choose a category" }).int().positive("Choose a category"),
    shortDescription: requiredText(300, "Short description"),
    description: z.string().trim().max(20_000, "Keep this under 20,000 characters"),
    regularPrice: optionalPrice,
    discountPrice: optionalPrice,
    colors: jsonArray(colorSchema, MAX_COLORS, "colours"),
    specs: jsonArray(specSchema, MAX_SPECS, "specifications"),
    sku: optionalText(50),
    material: optionalText(120),
    dimensions: optionalText(120),
    isMadeToOrder: checkbox,
    keywords: optionalText(255),
    status: z.enum(["DRAFT", "PUBLISHED"], { error: "Choose Draft or Published" }),
    isFeatured: checkbox,
    isPopular: checkbox,
    isNewArrival: checkbox,
    homeSortOrder: z.coerce
      .number({ error: "Use a number" })
      .int("Use a whole number")
      .min(0, "Use 0 or more")
      .max(9999, "Use 9999 or less"),
    seoTitle: optionalText(70),
    seoDescription: optionalText(170),
  })
  .transform(({ slug, ...rest }) => ({
    ...rest,
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
export const ADMIN_PRODUCT_FLAGS = ["featured", "popular", "new", "sale", "no-images"] as const;
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
