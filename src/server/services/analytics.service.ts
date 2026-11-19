// First-party analytics (ADR-040): records anonymous visits and contact clicks, and summarises
// them for the admin dashboard. No cookies; the visitor hash is an HMAC of the Dhaka day, the IP
// and the user agent, so it can't be reversed and changes every day. IPs are never stored.
import { createHmac } from "node:crypto";
import { connection } from "next/server";
import {
  EVENT_RETENTION_DAYS,
  INQUIRY_EVENT_TYPES,
  isBotUserAgent,
  percentChange,
  productSlugFromPath,
  type AnalyticsRange,
  type SiteEventType,
} from "@/lib/analytics";
import { serverEnv } from "@/lib/env";
import type { TrackEvent } from "@/lib/validation/analytics";
import { dhakaStartOfDay, toDhakaDateInput } from "@/lib/validation/home";
import {
  countEvents,
  countEventsByType,
  countVisitors,
  deleteSiteEventsBefore,
  findProductTitlesBySlug,
  findTopPaths,
  insertSiteEvent,
} from "@/server/repositories/analytics.repo";

const DAY_MS = 24 * 60 * 60 * 1000;

export function visitorHash(ip: string, userAgent: string, now: Date, secret: string): string {
  return createHmac("sha256", secret)
    .update(`${toDhakaDateInput(now)}|${ip}|${userAgent}`)
    .digest("hex")
    .slice(0, 16);
}

let lastPrune = 0;

/** Old events are removed at most once a day per process, while recording (no cron, rule 1). */
async function pruneOldEvents(now: Date): Promise<void> {
  if (now.getTime() - lastPrune < DAY_MS) return;
  lastPrune = now.getTime();
  await deleteSiteEventsBefore(new Date(now.getTime() - EVENT_RETENTION_DAYS * DAY_MS));
}

export type RecordContext = { ip: string; userAgent: string | null; now?: Date };

/** Saves one event unless it comes from a bot. Returns whether it was counted. */
export async function recordEvent(event: TrackEvent, context: RecordContext): Promise<boolean> {
  if (isBotUserAgent(context.userAgent)) return false;
  const now = context.now ?? new Date();
  await insertSiteEvent({
    type: event.type,
    path: event.path,
    visitorHash: visitorHash(context.ip, context.userAgent ?? "", now, serverEnv().AUTH_SECRET),
  });
  try {
    await pruneOldEvents(now);
  } catch (err) {
    console.error("[analytics.prune]", err);
  }
  return true;
}

// --- Dashboard ---------------------------------------------------------------------------------

export type Kpi = { value: number; previous: number; change: number | null };

export type RankedItem = { label: string; href: string | null; count: number };

export type AnalyticsSummary = {
  range: AnalyticsRange;
  visitors: Kpi;
  pageViews: Kpi;
  productViews: Kpi;
  whatsapp: Kpi;
  messenger: Kpi;
  calls: Kpi;
  inquiries: Kpi;
  /** Inquiries per 100 visitors, one decimal; null without visitors. */
  inquiryRate: number | null;
  topViewedProducts: RankedItem[];
  topInquiredProducts: RankedItem[];
  topPages: RankedItem[];
};

function kpi(value: number, previous: number): Kpi {
  return { value, previous, change: percentChange(value, previous) };
}

function byType(rows: { type: string; count: number }[]) {
  const get = (type: SiteEventType) => rows.find((r) => r.type === type)?.count ?? 0;
  return {
    views: get("view"),
    whatsapp: get("whatsapp"),
    messenger: get("messenger"),
    calls: get("call"),
  };
}

async function productList(rows: { path: string; count: number }[]): Promise<RankedItem[]> {
  const slugs = rows.map((r) => productSlugFromPath(r.path)).filter((s): s is string => !!s);
  const products = await findProductTitlesBySlug(slugs);
  return rows.flatMap((row) => {
    const slug = productSlugFromPath(row.path);
    if (!slug) return [];
    const product = products.find((p) => p.slug === slug);
    return [
      {
        label: product?.title ?? slug,
        href: product ? `/admin/products/${product.id}` : null,
        count: row.count,
      },
    ];
  });
}

type Period = { from: Date; to: Date };

/**
 * The [from, to) windows for a dashboard period and the one it's compared against.
 * - today: Dhaka midnight → now, vs the same stretch of yesterday (a fair comparison mid-day).
 * - yesterday: the whole previous Dhaka day, vs the day before it.
 * - 7/30/90: rolling windows ending now, vs the window before (ADR-040).
 */
export function analyticsPeriods(
  range: AnalyticsRange,
  now: Date,
): { current: Period; previous: Period } {
  const shift = (p: Period, ms: number): Period => ({
    from: new Date(p.from.getTime() - ms),
    to: new Date(p.to.getTime() - ms),
  });
  if (range === "today" || range === "yesterday") {
    const todayStart = dhakaStartOfDay(toDhakaDateInput(now));
    const current =
      range === "today"
        ? { from: todayStart, to: now }
        : { from: new Date(todayStart.getTime() - DAY_MS), to: todayStart };
    return { current, previous: shift(current, DAY_MS) };
  }
  const span = Number(range) * DAY_MS;
  const current = { from: new Date(now.getTime() - span), to: now };
  return { current, previous: shift(current, span) };
}

export async function getAnalyticsSummary(
  range: AnalyticsRange,
  at?: Date,
): Promise<AnalyticsSummary> {
  await connection();
  const { current, previous } = analyticsPeriods(range, at ?? new Date());

  const [types, prevTypes, visitors, prevVisitors, productViews, prevProductViews] =
    await Promise.all([
      countEventsByType(current),
      countEventsByType(previous),
      countVisitors(current),
      countVisitors(previous),
      countEvents("view", current, "/products/"),
      countEvents("view", previous, "/products/"),
    ]);
  const [viewedRows, inquiredRows, pageRows] = await Promise.all([
    findTopPaths(["view"], current, { prefix: "/products/", take: 5 }),
    findTopPaths(INQUIRY_EVENT_TYPES, current, { prefix: "/products/", take: 5 }),
    findTopPaths(["view"], current, { take: 5 }),
  ]);

  const now = byType(types);
  const before = byType(prevTypes);
  const inquiries = now.whatsapp + now.messenger + now.calls;
  const prevInquiries = before.whatsapp + before.messenger + before.calls;

  return {
    range,
    visitors: kpi(visitors, prevVisitors),
    pageViews: kpi(now.views, before.views),
    productViews: kpi(productViews, prevProductViews),
    whatsapp: kpi(now.whatsapp, before.whatsapp),
    messenger: kpi(now.messenger, before.messenger),
    calls: kpi(now.calls, before.calls),
    inquiries: kpi(inquiries, prevInquiries),
    inquiryRate: visitors > 0 ? Math.round((inquiries / visitors) * 1000) / 10 : null,
    topViewedProducts: await productList(viewedRows),
    topInquiredProducts: await productList(inquiredRows),
    topPages: pageRows.map((r) => ({ label: r.path, href: r.path, count: r.count })),
  };
}
