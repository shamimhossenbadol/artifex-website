// Zod schemas for search input (09 §3): 2–60 characters after trimming.
import { z } from "zod";
import { SEARCH_MAX_LENGTH, SEARCH_MIN_LENGTH } from "@/lib/search";

const firstValue = (v: unknown) => (Array.isArray(v) ? v[0] : v);

/** /api/search?q= — rejects anything outside 2–60 characters. */
export const searchQuerySchema = z.object({
  q: z.preprocess(firstValue, z.string().trim().min(SEARCH_MIN_LENGTH).max(SEARCH_MAX_LENGTH)),
});

/** /search?q=&page= — q may be empty (shows the search form); bad page numbers 404. */
export const searchPageSchema = z.object({
  q: z.preprocess(firstValue, z.string().trim().max(200).optional().catch(undefined)),
  page: z.preprocess(firstValue, z.coerce.number().int().min(1).max(1000).optional().default(1)),
});
