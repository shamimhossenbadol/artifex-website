// Zod schemas for the homepage editor (07 §3.5): hero, hero slides and promo banners.
import { z } from "zod";
import { optionalText, requiredText } from "./settings";

/** Site paths ("/products") or https links only (09 §3): no javascript:, no protocol-relative. */
export function isSafeLink(value: string): boolean {
  if (value.startsWith("/")) return !value.startsWith("//") && !value.includes("\\");
  try {
    return new URL(value).protocol === "https:";
  } catch {
    return false;
  }
}

const LINK_HELP = "Use a site path like /products or a full https:// link";

const requiredLink = (label: string) => requiredText(255, label).refine(isSafeLink, LINK_HELP);
const optionalLink = () => optionalText(255).refine((v) => v === null || isSafeLink(v), LINK_HELP);

export const heroSchema = z
  .object({
    eyebrow: optionalText(60),
    heading: requiredText(120, "Heading"),
    subheading: optionalText(240),
    ctaLabel: requiredText(40, "Button text"),
    ctaHref: requiredLink("Button link"),
    secondaryLabel: optionalText(40),
    secondaryHref: optionalLink(),
  })
  .refine((v) => (v.secondaryLabel === null) === (v.secondaryHref === null), {
    message: "Give the second button both a label and a link, or leave both empty",
    path: ["secondaryHref"],
  });

export type HeroInput = z.infer<typeof heroSchema>;

export const slideAltSchema = requiredText(160, "Photo description");

/** Dhaka is UTC+6 all year (no DST). Dates from <input type="date"> are Dhaka calendar days. */
const DHAKA_OFFSET_MS = 6 * 60 * 60 * 1000;

export function dhakaStartOfDay(date: string): Date {
  return new Date(`${date}T00:00:00.000+06:00`);
}

export function dhakaEndOfDay(date: string): Date {
  return new Date(`${date}T23:59:59.999+06:00`);
}

/** Date → "YYYY-MM-DD" in Dhaka, for <input type="date"> values. */
export function toDhakaDateInput(date: Date | null): string {
  return date ? new Date(date.getTime() + DHAKA_OFFSET_MS).toISOString().slice(0, 10) : "";
}

const dateInput = z
  .string()
  .trim()
  .refine(
    (v) => v === "" || (/^\d{4}-\d{2}-\d{2}$/.test(v) && !isNaN(dhakaStartOfDay(v).getTime())),
    {
      message: "Use a valid date",
    },
  );

const checkbox = z
  .string()
  .optional()
  .transform((v) => v === "on");

export const bannerSchema = z
  .object({
    title: requiredText(100, "Title"),
    subtitle: optionalText(200),
    imageAlt: requiredText(160, "Image description"),
    linkHref: optionalLink(),
    linkLabel: optionalText(40),
    isActive: checkbox,
    startsAt: dateInput.transform((v) => (v ? dhakaStartOfDay(v) : null)),
    endsAt: dateInput.transform((v) => (v ? dhakaEndOfDay(v) : null)),
  })
  .refine((v) => !v.startsAt || !v.endsAt || v.startsAt <= v.endsAt, {
    message: "The end date must be on or after the start date",
    path: ["endsAt"],
  });

export type BannerInput = z.infer<typeof bannerSchema>;

export const idSchema = z.coerce.number().int().positive();
