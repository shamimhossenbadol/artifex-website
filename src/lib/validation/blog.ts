// Zod schemas for the admin Journal (07 §3.4).
import { z } from "zod";
import { parseTags } from "@/lib/blog";
import { slugify } from "./category";
import { dhakaStartOfDay } from "./home";
import { optionalText, requiredText } from "./settings";

export const POST_SLUG_MAX = 180;
export const ADMIN_POSTS_PER_PAGE = 20;
const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

const checkbox = z
  .string()
  .optional()
  .transform((v) => v === "on");

/** "YYYY-MM-DD" (a Dhaka calendar day) or blank. */
const dateInput = z
  .string()
  .trim()
  .refine(
    (v) => v === "" || (/^\d{4}-\d{2}-\d{2}$/.test(v) && !isNaN(dhakaStartOfDay(v).getTime())),
    "Use a valid date",
  )
  .transform((v) => (v === "" ? null : v));

export const postSchema = z
  .object({
    title: requiredText(160, "Title"),
    slug: z.string().trim().max(POST_SLUG_MAX, `Keep this under ${POST_SLUG_MAX} characters`),
    excerpt: requiredText(300, "Excerpt"),
    content: z
      .string()
      .trim()
      .min(1, "Write the post")
      .max(100_000, "Keep this under 100,000 characters"),
    coverImageAlt: optionalText(160),
    removeCover: checkbox,
    authorName: requiredText(80, "Author"),
    // Normalised: lowercase, unique, comma-separated.
    tags: optionalText(255).transform((v) => (v ? parseTags(v).join(", ") || null : null)),
    status: z.enum(["DRAFT", "PUBLISHED"], { error: "Choose Draft or Published" }),
    publishDate: dateInput,
    seoTitle: optionalText(70),
    seoDescription: optionalText(170),
  })
  .transform(({ slug, ...rest }) => ({ ...rest, slug: slugify(slug || rest.title, POST_SLUG_MAX) }))
  .refine((v) => SLUG_PATTERN.test(v.slug), {
    message: "Use letters or numbers in the title or web address",
    path: ["slug"],
  });

export type PostInput = z.infer<typeof postSchema>;

const firstValue = (v: unknown) => (Array.isArray(v) ? v[0] : v);

export const adminPostQuerySchema = z.object({
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
  status: z.preprocess(firstValue, z.enum(["DRAFT", "PUBLISHED"]).optional().catch(undefined)),
  page: z.preprocess(firstValue, z.coerce.number().int().min(1).max(10_000).catch(1).default(1)),
});

export type AdminPostQuery = z.infer<typeof adminPostQuerySchema>;

const BLOG_KEY = /\bblog\/\d{4}\/(?:0[1-9]|1[0-2])\/[a-z0-9]{12}\b/g;

/** R2 key bases of uploaded images referenced in a post's Markdown ("Insert image"). */
export function blogImageKeys(markdown: string): Set<string> {
  return new Set(markdown.match(BLOG_KEY) ?? []);
}
