// Zod schema for the admin category form (07 §3.3).
import { z } from "zod";
import { optionalText, requiredText } from "./settings";

const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
export const CATEGORY_SLUG_MAX = 100;

/** "Dining Tables & Chairs" → "dining-tables-chairs" (ASCII kebab-case, 11 §1). */
export function slugify(value: string, max = CATEGORY_SLUG_MAX): string {
  return value
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, max)
    .replace(/-+$/g, "");
}

const checkbox = z
  .string()
  .optional()
  .transform((v) => v === "on");

export const categorySchema = z
  .object({
    name: requiredText(80, "Name"),
    // Blank → derived from the name. Typed slugs are normalised the same way.
    slug: z
      .string()
      .trim()
      .max(CATEGORY_SLUG_MAX, `Keep this under ${CATEGORY_SLUG_MAX} characters`),
    description: optionalText(1000),
    isActive: checkbox,
    showOnHome: checkbox,
    removeImage: checkbox,
    seoTitle: optionalText(70),
    seoDescription: optionalText(170),
  })
  .transform(({ slug, ...rest }) => ({ ...rest, slug: slugify(slug || rest.name) }))
  .refine((v) => SLUG_PATTERN.test(v.slug), {
    message: "Use letters or numbers in the name or web address",
    path: ["slug"],
  });

export type CategoryInput = z.infer<typeof categorySchema>;

export const CATEGORY_FLAGS = ["isActive", "showOnHome"] as const;
export type CategoryFlag = (typeof CATEGORY_FLAGS)[number];
export const categoryFlagSchema = z.enum(CATEGORY_FLAGS);
