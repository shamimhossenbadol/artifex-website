import { ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

type PaginationProps = {
  page: number;
  pageCount: number;
  /** Builds the URL for a page number (keeps sort/filters; page 1 has no param). */
  hrefFor: (page: number) => string;
};

/** Pages to show: first, last, current ±1, with gaps marked by null. */
export function pageWindow(page: number, pageCount: number): (number | null)[] {
  const pages = new Set([1, pageCount, page - 1, page, page + 1]);
  const sorted = [...pages].filter((p) => p >= 1 && p <= pageCount).sort((a, b) => a - b);
  const result: (number | null)[] = [];
  for (const p of sorted) {
    const prev = result.at(-1);
    if (typeof prev === "number" && p - prev > 1) result.push(null);
    result.push(p);
  }
  return result;
}

const ITEM =
  "inline-flex size-11 items-center justify-center rounded-md text-sm font-medium tabular-nums transition-colors";

/** Numbered pagination with Prev/Next as real, crawlable links (05 §3, F1.1). */
export function Pagination({ page, pageCount, hrefFor }: PaginationProps) {
  if (pageCount <= 1) return null;
  return (
    <nav aria-label="Pagination" className="mt-14 flex justify-center">
      <ul className="flex items-center gap-1">
        <li>
          {page > 1 ? (
            <Link
              href={hrefFor(page - 1)}
              rel="prev"
              className={cn(ITEM, "text-ink hover:bg-sand")}
            >
              <ChevronLeft aria-hidden strokeWidth={1.5} className="size-5" />
              <span className="sr-only">Previous page</span>
            </Link>
          ) : (
            <span className={cn(ITEM, "text-line")} aria-hidden>
              <ChevronLeft strokeWidth={1.5} className="size-5" />
            </span>
          )}
        </li>
        {pageWindow(page, pageCount).map((p, i) =>
          p === null ? (
            <li key={`gap-${i}`} aria-hidden className={cn(ITEM, "text-muted")}>
              …
            </li>
          ) : (
            <li key={p}>
              <Link
                href={hrefFor(p)}
                aria-current={p === page ? "page" : undefined}
                className={cn(
                  ITEM,
                  p === page ? "bg-ink text-bg" : "text-ink-soft hover:bg-sand hover:text-ink",
                )}
              >
                <span className="sr-only">Page </span>
                {p}
              </Link>
            </li>
          ),
        )}
        <li>
          {page < pageCount ? (
            <Link
              href={hrefFor(page + 1)}
              rel="next"
              className={cn(ITEM, "text-ink hover:bg-sand")}
            >
              <ChevronRight aria-hidden strokeWidth={1.5} className="size-5" />
              <span className="sr-only">Next page</span>
            </Link>
          ) : (
            <span className={cn(ITEM, "text-line")} aria-hidden>
              <ChevronRight strokeWidth={1.5} className="size-5" />
            </span>
          )}
        </li>
      </ul>
    </nav>
  );
}
