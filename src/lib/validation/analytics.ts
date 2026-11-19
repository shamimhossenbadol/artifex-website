// Zod schemas for first-party analytics (ADR-040): /api/track bodies and the dashboard period.
import { z } from "zod";
import { ANALYTICS_RANGES, DEFAULT_ANALYTICS_RANGE, SITE_EVENT_TYPES } from "@/lib/analytics";

/** A page path: starts with one "/", no query or fragment, nothing outside printable ASCII. */
const pathSchema = z
  .string()
  .max(255)
  .regex(/^\/(?!\/)[\x21-\x7e]*$/, "Invalid path")
  .refine((p) => !p.includes("?") && !p.includes("#"), "Invalid path");

export const trackEventSchema = z.object({
  type: z.enum(SITE_EVENT_TYPES),
  path: pathSchema,
});

export type TrackEvent = z.infer<typeof trackEventSchema>;

/** `?range=` on the dashboard; anything unknown (or repeated) falls back to 30 days. */
export const analyticsRangeSchema = z.enum(ANALYTICS_RANGES).catch(DEFAULT_ANALYTICS_RANGE);
