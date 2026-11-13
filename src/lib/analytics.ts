// First-party analytics (ADR-040): event types and helpers shared by the browser
// tracker, the /api/track route and the admin dashboard. No cookies, no personal data stored.

export const SITE_EVENT_TYPES = ["view", "whatsapp", "messenger", "call"] as const;
export type SiteEventType = (typeof SITE_EVENT_TYPES)[number];

/** Clicks that count as an inquiry (someone reached out). */
export const INQUIRY_EVENT_TYPES = [
  "whatsapp",
  "messenger",
  "call",
] as const satisfies readonly SiteEventType[];

/** Largest body /api/track accepts; a real event is well under 300 bytes. */
export const MAX_TRACK_BODY_BYTES = 1024;

/** Which contact channel a link opens, if any (wa.me, m.me, tel:). */
export function classifyContactLink(href: string): Exclude<SiteEventType, "view"> | null {
  let url: URL;
  try {
    url = new URL(href, "https://example.invalid");
  } catch {
    return null;
  }
  if (url.protocol === "tel:") return "call";
  if (url.protocol !== "https:" && url.protocol !== "http:") return null;
  const host = url.hostname.replace(/^www\./, "");
  if (host === "wa.me" || host === "api.whatsapp.com" || host === "web.whatsapp.com") {
    return "whatsapp";
  }
  if (host === "m.me" || host === "messenger.com") return "messenger";
  return null;
}

/** Crawlers, link previews and test browsers: their requests aren't counted. */
const BOT_PATTERN =
  /bot|crawl|spider|slurp|headless|lighthouse|pagespeed|preview|facebookexternalhit|whatsapp|curl|wget|python|node-fetch|playwright/i;

export function isBotUserAgent(userAgent: string | null): boolean {
  return !userAgent || BOT_PATTERN.test(userAgent);
}

/** Dashboard periods in days. */
export const ANALYTICS_RANGES = [7, 30, 90] as const;
export type AnalyticsRange = (typeof ANALYTICS_RANGES)[number];

/** Events are kept this long, then removed (no cron: pruned while recording). */
export const EVENT_RETENTION_DAYS = 400;

/** "/products/<slug>" → slug, for product pages only. */
export function productSlugFromPath(path: string): string | null {
  const match = /^\/products\/([a-z0-9-]+)\/?$/.exec(path);
  return match?.[1] ?? null;
}

/** Percent change, or null when there's nothing to compare against. */
export function percentChange(current: number, previous: number): number | null {
  if (previous === 0) return null;
  return Math.round(((current - previous) / previous) * 100);
}
