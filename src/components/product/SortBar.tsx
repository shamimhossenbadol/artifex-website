import { Check } from "lucide-react";
import Link from "next/link";
import { listingHref, type ListingQuery, type ProductSort } from "@/lib/validation/catalog";
import { cn } from "@/lib/utils";

const SORT_LABELS: Record<ProductSort, string> = {
  newest: "Newest",
  price_asc: "Price: low to high",
  price_desc: "Price: high to low",
};

const CHIP =
  "inline-flex min-h-11 shrink-0 items-center gap-1.5 rounded-md border px-4 text-sm whitespace-nowrap transition-colors";

/**
 * Sort + "On sale" toggle as plain links (05 §3): shareable URLs, works before JavaScript loads,
 * zero client JS (ADR-025). Changing sort or the filter resets to page 1. Sort URLs are nofollow
 * because pages canonicalise without sort/filter params (08 §1). Hidden on phones (ADR-089): the
 * listing there is the grid alone.
 */
export function SortBar({
  basePath,
  query,
  total,
}: {
  basePath: string;
  query: ListingQuery;
  total: number;
}) {
  return (
    <div className="mb-10 hidden items-center justify-between gap-3 md:flex">
      <p className="text-small text-muted" aria-live="polite">
        {total} {total === 1 ? "product" : "products"}
      </p>
      <div className="flex flex-wrap justify-end gap-2">
        <nav aria-label="Sort products" className="contents">
          {(Object.keys(SORT_LABELS) as ProductSort[]).map((sort) => {
            const active = query.sort === sort;
            return (
              <Link
                key={sort}
                href={listingHref(basePath, { sort, onSale: query.onSale })}
                rel="nofollow"
                aria-current={active ? "true" : undefined}
                className={cn(
                  CHIP,
                  active
                    ? "border-ink bg-ink text-bg"
                    : "border-line bg-surface text-ink-soft hover:border-ink hover:text-ink",
                )}
              >
                {SORT_LABELS[sort]}
              </Link>
            );
          })}
        </nav>
        <Link
          href={listingHref(basePath, { sort: query.sort, onSale: !query.onSale })}
          rel="nofollow"
          aria-pressed={query.onSale}
          className={cn(
            CHIP,
            query.onSale
              ? "border-sale bg-sale text-white"
              : "border-line bg-surface text-ink-soft hover:border-sale hover:text-sale",
          )}
        >
          {query.onSale && <Check aria-hidden strokeWidth={2} className="size-4" />}
          On sale
        </Link>
      </div>
    </div>
  );
}
