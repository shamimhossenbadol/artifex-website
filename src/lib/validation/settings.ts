// Zod schemas for site settings (09 §3): the stored opening hours, and the admin settings forms.
import { z } from "zod";

const time = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Use HH:MM (24-hour)");

export const openingHoursEntrySchema = z.union([
  z.object({ days: z.string().trim().min(1).max(40), closed: z.literal(true) }),
  z.object({ days: z.string().trim().min(1).max(40), open: time, close: time }),
]);

export const openingHoursSchema = z.array(openingHoursEntrySchema).max(14);

export type OpeningHoursEntry = z.infer<typeof openingHoursEntrySchema>;

/** Parses the stored JSON. Bad data never breaks the page: it just shows no hours. */
export function parseOpeningHours(value: unknown): OpeningHoursEntry[] {
  const result = openingHoursSchema.safeParse(value);
  return result.success ? result.data : [];
}

// ---------------------------------------------------------------------------------------------
// Admin settings forms (07 §3.6). Each tab posts its own section.

/** Trimmed text; blank becomes null. */
export const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max, `Keep this under ${max} characters`)
    .transform((v) => (v === "" ? null : v));

export const requiredText = (max: number, label: string) =>
  z.string().trim().min(1, `${label} is required`).max(max, `Keep this under ${max} characters`);

function isHttpsUrl(value: string, hosts?: readonly string[]): boolean {
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    return false;
  }
  if (url.protocol !== "https:") return false;
  return !hosts || hosts.some((h) => url.hostname === h || url.hostname.endsWith(`.${h}`));
}

/** Optional https URL, limited to the given hosts (and their subdomains) when provided. */
function optionalHttpsUrl(max: number, hosts?: readonly string[], help?: string) {
  return optionalText(max).refine((v) => v === null || isHttpsUrl(v, hosts), {
    message: help ?? "Enter a full link starting with https://",
  });
}

/**
 * WhatsApp numbers are stored as digits in international format (8801XXXXXXXXX). Accepts what the
 * owner is likely to type: "01757-758388", "+880 1757 758388", "8801757758388".
 */
export function normalizeWhatsAppNumber(input: string): string {
  const digits = input.replace(/\D/g, "");
  return /^01\d{9}$/.test(digits) ? `88${digits}` : digits;
}

export const whatsappNumberSchema = z
  .string()
  .trim()
  .min(1, "WhatsApp number is required")
  .transform(normalizeWhatsAppNumber)
  .refine((v) => /^\d{8,15}$/.test(v), {
    message: "Use a full number, e.g. 01757-758388 or +880 1757-758388",
  })
  .refine((v) => !v.startsWith("880") || /^8801[3-9]\d{8}$/.test(v), {
    message: "This doesn't look like a Bangladeshi mobile number (01XXXXXXXXX)",
  });

export const MAP_EMBED_PREFIX = "https://www.google.com/maps/embed";

/** Accepts the embed URL or the whole <iframe …> snippet Google gives, and returns the src. */
export function extractMapEmbedSrc(input: string): string {
  const trimmed = input.trim();
  const match = /<iframe[^>]*\ssrc=["']([^"']+)["']/i.exec(trimmed);
  return (match?.[1] ?? trimmed).replace(/&amp;/g, "&");
}

const mapEmbedSchema = z
  .string()
  .trim()
  .max(4000)
  .transform((v) => (v === "" ? null : extractMapEmbedSrc(v)))
  .refine((v) => v === null || (v.startsWith(`${MAP_EMBED_PREFIX}?`) && v.length <= 1000), {
    message: "Paste the embed link from Google Maps (Share → Embed a map → Copy HTML)",
  });

const coordinate = (limit: number, label: string) =>
  z
    .string()
    .trim()
    .transform((v) => (v === "" ? null : Number(v)))
    .refine((v) => v === null || (Number.isFinite(v) && Math.abs(v) <= limit), {
      message: `${label} must be a number between -${limit} and ${limit}`,
    });

/** The hours editor posts its rows as JSON in one hidden field. */
const openingHoursJsonSchema = z.string().transform((value, ctx) => {
  let parsed: unknown;
  try {
    parsed = JSON.parse(value || "[]");
  } catch {
    ctx.addIssue({ code: "custom", message: "Opening hours couldn't be read" });
    return z.NEVER;
  }
  const result = openingHoursSchema.safeParse(parsed);
  if (!result.success) {
    ctx.addIssue({
      code: "custom",
      message: "Every row needs days, and either opening and closing times or Closed",
    });
    return z.NEVER;
  }
  return result.data;
});

export const businessSettingsSchema = z.object({
  section: z.literal("business"),
  businessName: requiredText(100, "Business name"),
  tagline: optionalText(160),
  aboutShort: optionalText(600),
  aboutContent: optionalText(20000),
});

export const contactSettingsSchema = z.object({
  section: z.literal("contact"),
  phone: requiredText(30, "Phone"),
  whatsappNumber: whatsappNumberSchema,
  email: optionalText(120).refine(
    (v) => v === null || z.email().safeParse(v).success,
    "Enter a valid email address",
  ),
  whatsappDefaultMessage: requiredText(300, "Default message"),
  whatsappProductTemplate: requiredText(300, "Product message").refine(
    (v) => v.includes("{product}"),
    "Include {product} so the message names the product",
  ),
});

export const locationSettingsSchema = z.object({
  section: z.literal("location"),
  addressLine: requiredText(255, "Address"),
  city: requiredText(80, "City"),
  mapEmbedUrl: mapEmbedSchema,
  mapLinkUrl: optionalHttpsUrl(500),
  latitude: coordinate(90, "Latitude"),
  longitude: coordinate(180, "Longitude"),
  openingHours: openingHoursJsonSchema,
});

export const socialSettingsSchema = z.object({
  section: z.literal("social"),
  facebookUrl: optionalHttpsUrl(
    255,
    ["facebook.com", "fb.com"],
    "Use a facebook.com link starting with https://",
  ),
  instagramUrl: optionalHttpsUrl(
    255,
    ["instagram.com"],
    "Use an instagram.com link starting with https://",
  ),
  youtubeUrl: optionalHttpsUrl(
    255,
    ["youtube.com", "youtu.be"],
    "Use a youtube.com link starting with https://",
  ),
});

export const seoSettingsSchema = z.object({
  section: z.literal("seo"),
  defaultSeoTitle: requiredText(70, "Default title"),
  defaultSeoDescription: requiredText(170, "Default description"),
  removeOgImage: z
    .string()
    .optional()
    .transform((v) => v === "on"),
});

export const settingsFormSchema = z.discriminatedUnion("section", [
  businessSettingsSchema,
  contactSettingsSchema,
  locationSettingsSchema,
  socialSettingsSchema,
  seoSettingsSchema,
]);

export type SettingsForm = z.infer<typeof settingsFormSchema>;
export type SettingsSection = SettingsForm["section"];
