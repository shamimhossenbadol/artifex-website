// Opening hours (F5): parse the admin's day labels ("Sat–Thu", "Fri", "Mon, Wed", "Daily"),
// compute "Open now / Closed now" in Asia/Dhaka, and build schema.org OpeningHoursSpecification.
import type { OpeningHoursEntry } from "@/lib/validation/settings";

export const BUSINESS_TIME_ZONE = "Asia/Dhaka";

/** Index 0 = Sunday … 6 = Saturday (JavaScript's getDay order). */
const DAY_NAMES = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
const SCHEMA_DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

function dayIndex(token: string): number | null {
  const t = token.trim().toLowerCase().replace(/\.$/, "");
  if (t.length < 3) return null;
  const index = DAY_NAMES.findIndex((name) => name.startsWith(t));
  return index === -1 ? null : index;
}

/**
 * "Sat–Thu" → [6,0,1,2,3,4]; "Fri" → [5]; "Mon, Wed" → [1,3]; "Daily"/"Every day" → all.
 * Returns null when the label can't be understood (then no open/closed status is shown).
 */
export function parseDays(label: string): number[] | null {
  const text = label.trim().toLowerCase();
  if (/^(daily|every ?day|all week|7 days)$/.test(text)) return [0, 1, 2, 3, 4, 5, 6];
  const days = new Set<number>();
  for (const part of text.split(/[,&/]| and /)) {
    const range = part.split(/\s*(?:–|—|-|to)\s*/).filter(Boolean);
    if (range.length === 1) {
      const d = dayIndex(range[0]!);
      if (d === null) return null;
      days.add(d);
    } else if (range.length === 2) {
      const start = dayIndex(range[0]!);
      const end = dayIndex(range[1]!);
      if (start === null || end === null) return null;
      for (let d = start; ; d = (d + 1) % 7) {
        days.add(d);
        if (d === end) break;
      }
    } else {
      return null;
    }
  }
  return days.size > 0 ? [...days] : null;
}

function toMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(":").map(Number);
  return (h ?? 0) * 60 + (m ?? 0);
}

/** Weekday (0–6) and minutes since midnight for `now` in Dhaka. */
export function dhakaClock(now: Date): { day: number; minutes: number } {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: BUSINESS_TIME_ZONE,
    weekday: "long",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(now);
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "";
  return {
    day: DAY_NAMES.indexOf(get("weekday").toLowerCase()),
    minutes: Number(get("hour")) * 60 + Number(get("minute")),
  };
}

export type OpenStatus = { open: boolean; label: string } | null;

/** "Open now · until 21:00" / "Closed now", or null if the hours can't be interpreted. */
export function getOpenStatus(entries: OpeningHoursEntry[], now: Date): OpenStatus {
  if (entries.length === 0) return null;
  const { day, minutes } = dhakaClock(now);
  let understood = false;
  for (const entry of entries) {
    const days = parseDays(entry.days);
    if (!days) continue;
    understood = true;
    if (!days.includes(day) || "closed" in entry) continue;
    const open = toMinutes(entry.open);
    const close = toMinutes(entry.close);
    if (minutes >= open && minutes < close)
      return { open: true, label: `Open now · until ${entry.close}` };
  }
  return understood ? { open: false, label: "Closed now" } : null;
}

/** schema.org OpeningHoursSpecification for the LocalBusiness JSON-LD (08 §2). */
export function toOpeningHoursSpecification(entries: OpeningHoursEntry[]) {
  return entries.flatMap((entry) => {
    if ("closed" in entry) return [];
    const days = parseDays(entry.days);
    if (!days) return [];
    return [
      {
        "@type": "OpeningHoursSpecification",
        dayOfWeek: days.map((d) => SCHEMA_DAYS[d]),
        opens: entry.open,
        closes: entry.close,
      },
    ];
  });
}
