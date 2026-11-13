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
  "inline-flex min-h-11 shrink-0 items-center gap-1.5 rounded-md border px-3.5 text-sm whitespace-nowrap transition-colors sm:px-4";

/** Short labels for phones (the full ones from sm up). */
const SHORT_LABELS: Record<ProductSort, string> = {
  newest: "Newest",
  price_asc: "Lowest price",
  price_desc: "Highest price",
};

/**
 * Sort + "On sale" toggle as plain links (05 §3): shareable URLs, works before JavaScript loads,
 * zero client JS (ADR-025). Changing sort or the filter resets to page 1. Sort URLs are nofollow
 * because pages canonicalise without sort/filter params (08 §1).
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
    <div className="mb-6 flex flex-col gap-3 md:mb-10 md:flex-row md:items-center md:justify-between">
      <p className="text-small text-muted" aria-live="polite">
        {total} {total === 1 ? "product" : "products"}
      </p>
      <div className="relative -mx-4 flex [scrollbar-width:none] gap-2 overflow-x-auto px-4 pb-1 md:mx-0 md:px-0 [&::-webkit-scrollbar]:hidden">
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
                <span className="sm:hidden">{SHORT_LABELS[sort]}</span>
                <span className="hidden sm:inline">{SORT_LABELS[sort]}</span>
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
