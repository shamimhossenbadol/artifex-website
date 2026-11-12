// Blog helpers (F4): reading time, tags and date formatting. Pure functions, unit tested.
import { BUSINESS_TIME_ZONE } from "@/lib/opening-hours";

export const POSTS_PER_PAGE = 9;
const WORDS_PER_MINUTE = 200;

/** Words / 200, rounded up, at least 1 minute. Markdown syntax is ignored. */
export function readingTimeMinutes(markdown: string): number {
  const text = markdown
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/!\[[^\]]*]\([^)]*\)/g, " ")
    .replace(/\[([^\]]*)]\([^)]*\)/g, "$1")
    .replace(/[#>*_`~|-]/g, " ");
  const words = text.split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(words / WORDS_PER_MINUTE));
}

/** "Sofas, Living Room ,sofas" → ["sofas", "living room"] */
export function parseTags(tags: string | null | undefined): string[] {
  if (!tags) return [];
  return [
    ...new Set(
      tags
        .split(",")
        .map((t) => t.trim().toLowerCase())
        .filter(Boolean),
    ),
  ];
}

/** "12 November 2026", shown in Dhaka time (11 §6). */
export function formatPostDate(date: Date): string {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: BUSINESS_TIME_ZONE,
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
}
