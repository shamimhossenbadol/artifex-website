import { Pagination } from "@/components/ui/Pagination";
import { listingHref, type ListingQuery } from "@/lib/validation/catalog";
import type { ProductListing as ProductListingData } from "@/server/services/catalog.service";
import { EmptyListing } from "./EmptyListing";
import { ProductGrid } from "./ProductGrid";
import { SortBar } from "./SortBar";

/** Sort bar + grid + pagination for /products and /categories/[slug] (05 §3). */
export function ProductListing({
  basePath,
  query,
  listing,
  emptyMessage,
  categorySlug,
}: {
  basePath: string;
  query: ListingQuery;
  listing: ProductListingData;
  emptyMessage: string;
  categorySlug?: string;
}) {
  return (
    <>
      <SortBar basePath={basePath} query={query} total={listing.total} />
      {listing.items.length === 0 ? (
        <EmptyListing
          message={query.onSale ? "Nothing on sale here right now." : emptyMessage}
          excludeSlug={categorySlug}
        />
      ) : (
        <ProductGrid products={listing.items} />
      )}
      <Pagination
        page={listing.page}
        pageCount={listing.pageCount}
        hrefFor={(page) => listingHref(basePath, { ...query, page })}
      />
    </>
  );
}
