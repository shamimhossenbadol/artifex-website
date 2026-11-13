// First-party analytics queries (ADR-040). The only place that reads or writes SiteEvent.
import type { SiteEventType } from "@/lib/analytics";
import { db } from "@/lib/db";

export async function insertSiteEvent(data: {
  type: SiteEventType;
  path: string;
  visitorHash: string;
}): Promise<void> {
  await db.siteEvent.create({ data, select: { id: true } });
}

export async function deleteSiteEventsBefore(date: Date): Promise<number> {
  const { count } = await db.siteEvent.deleteMany({ where: { createdAt: { lt: date } } });
  return count;
}

type Range = { from: Date; to: Date };

/** Event counts per type in [from, to). */
export async function countEventsByType({ from, to }: Range) {
  const rows = await db.siteEvent.groupBy({
    by: ["type"],
    where: { createdAt: { gte: from, lt: to } },
    _count: { _all: true },
  });
  return rows.map((r) => ({ type: r.type, count: r._count._all }));
}

/**
 * Distinct visitors in [from, to). The hash rotates daily, so someone who visits on three days
 * counts three times: this is "daily unique visitors" summed over the period.
 */
export async function countVisitors({ from, to }: Range): Promise<number> {
  const rows = await db.$queryRaw<{ visitors: bigint | number }[]>`
    SELECT COUNT(DISTINCT visitorHash) AS visitors
    FROM SiteEvent
    WHERE createdAt >= ${from} AND createdAt < ${to}`;
  return Number(rows[0]?.visitors ?? 0);
}

/** Count of one event type in [from, to), optionally only for paths under a prefix. */
export async function countEvents(
  type: SiteEventType,
  { from, to }: Range,
  prefix?: string,
): Promise<number> {
  return db.siteEvent.count({
    where: {
      type,
      createdAt: { gte: from, lt: to },
      ...(prefix ? { path: { startsWith: prefix } } : {}),
    },
  });
}

/** Most frequent paths for the given event types, optionally only under a prefix. */
export async function findTopPaths(
  types: readonly SiteEventType[],
  { from, to }: Range,
  options: { prefix?: string; take: number },
) {
  const rows = await db.siteEvent.groupBy({
    by: ["path"],
    where: {
      type: { in: [...types] },
      createdAt: { gte: from, lt: to },
      ...(options.prefix ? { path: { startsWith: options.prefix } } : {}),
    },
    _count: { path: true },
    orderBy: { _count: { path: "desc" } },
    take: options.take,
  });
  return rows.map((r) => ({ path: r.path, count: r._count.path }));
}

/** Product titles for dashboard lists (any status: a product may have been unpublished since). */
export async function findProductTitlesBySlug(slugs: string[]) {
  if (slugs.length === 0) return [];
  return db.product.findMany({
    where: { slug: { in: slugs } },
    select: { id: true, slug: true, title: true },
  });
}
