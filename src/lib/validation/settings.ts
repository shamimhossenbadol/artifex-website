// Zod schemas for site settings (09 §3). Shared by the settings service now and admin forms later.
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
