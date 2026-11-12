import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { EmptyListing } from "@/components/product/EmptyListing";
import { ProductGrid } from "@/components/product/ProductGrid";
import { ProductGridSkeleton } from "@/components/product/ProductGridSkeleton";
import { Button } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { Input } from "@/components/ui/Input";
import { Pagination } from "@/components/ui/Pagination";
import { SEARCH_MAX_LENGTH, SEARCH_MIN_LENGTH, isSearchable, normalizeQuery } from "@/lib/search";
import { searchPageSchema } from "@/lib/validation/search";
import { searchProducts } from "@/server/services/search.service";

type Props = PageProps<"/search">;

// Search results are never indexed (08 §1); links on them are still followed.
export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const parsed = searchPageSchema.safeParse(await searchParams);
  const q = parsed.success ? (parsed.data.q ?? "") : "";
  return {
    title: q ? `Search: ${q}` : "Search",
    robots: { index: false, follow: true },
  };
}

function resultsHref(q: string, page: number): string {
  const params = new URLSearchParams({ q });
  if (page > 1) params.set("page", String(page));
  return `/search?${params.toString()}`;
}

function SearchForm({ defaultValue }: { defaultValue: string }) {
  return (
    <form action="/search" method="get" role="search" className="flex w-full max-w-xl gap-2">
      <label htmlFor="search-page-input" className="sr-only">
        Search products
      </label>
      <Input
        id="search-page-input"
        type="search"
        name="q"
        defaultValue={defaultValue}
        placeholder="Search sofas, beds, chandeliers…"
        minLength={SEARCH_MIN_LENGTH}
        maxLength={SEARCH_MAX_LENGTH}
        required
        enterKeyHint="search"
      />
      <Button type="submit">Search</Button>
    </form>
  );
}

async function SearchResults({ searchParams }: Pick<Props, "searchParams">) {
  const parsed = searchPageSchema.safeParse(await searchParams);
  if (!parsed.success) notFound();
  const raw = parsed.data.q ?? "";
  const query = normalizeQuery(raw);
  const page = parsed.data.page;

  if (!isSearchable(query)) {
    return (
      <>
        <h1 className="text-h1">Search</h1>
        <p className="text-body-lg mt-3 mb-8">
          Find sofas, beds, dining tables, chandeliers and more.
        </p>
        <SearchForm defaultValue={raw} />
        <div className="mt-12">
          <EmptyListing message="Or browse by category" />
        </div>
      </>
    );
  }

  const results = await searchProducts(query, page);
  if (page > results.pageCount) notFound();

  return (
    <>
      <p className="text-eyebrow text-walnut">Search results</p>
      <h1 className="text-h1 mt-2 break-words">“{raw.trim()}”</h1>
      <p className="text-small text-muted mt-3 mb-8" aria-live="polite">
        {results.total} {results.total === 1 ? "product" : "products"} found
      </p>
      <div className="mb-10">
        <SearchForm defaultValue={raw.trim()} />
      </div>
      {results.items.length === 0 ? (
        <EmptyListing message={`No results for “${raw.trim()}”`} />
      ) : (
        <ProductGrid products={results.items} />
      )}
      <Pagination
        page={results.page}
        pageCount={results.pageCount}
        hrefFor={(p) => resultsHref(query, p)}
      />
    </>
  );
}

export default function SearchPage({ searchParams }: Props) {
  return (
    <Container className="py-8 md:py-12">
      <Suspense fallback={<ProductGridSkeleton />}>
        <SearchResults searchParams={searchParams} />
      </Suspense>
    </Container>
  );
}
