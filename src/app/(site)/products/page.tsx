import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ListingSkeleton } from "@/components/product/ListingHeaderSkeleton";
import { ProductListing } from "@/components/product/ProductListing";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { Container } from "@/components/ui/Container";
import { JsonLd } from "@/components/ui/JsonLd";
import { breadcrumbJsonLd } from "@/lib/seo";
import { listingHref, parseListingQuery } from "@/lib/validation/catalog";
import { listProducts } from "@/server/services/catalog.service";

const BASE_PATH = "/products";
const TITLE = "All furniture";

export async function generateMetadata({
  searchParams,
}: PageProps<"/products">): Promise<Metadata> {
  const query = parseListingQuery(await searchParams);
  const page = query?.page ?? 1;
  return {
    title: page > 1 ? `${TITLE} (page ${page})` : TITLE,
    description:
      "Sofas, dining tables, beds, chairs, doors and curtains, crafted in Dhaka. Browse the full Artifex Furniture collection and message us on WhatsApp.",
    // Self-canonical per page, without sort/filter params (08 §1).
    alternates: { canonical: listingHref(BASE_PATH, { page }) },
  };
}

async function AllProducts({ searchParams }: Pick<PageProps<"/products">, "searchParams">) {
  const query = parseListingQuery(await searchParams);
  if (!query) notFound();
  const listing = await listProducts(query);
  if (query.page > listing.pageCount) notFound();

  const crumbs = [
    { name: "Home", path: "/" },
    { name: TITLE, path: BASE_PATH },
  ];
  return (
    <>
      <JsonLd data={breadcrumbJsonLd(crumbs)} />
      <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: TITLE }]} />
      <h1 className="text-h1 mt-6">{TITLE}</h1>
      <p className="text-body-lg mt-3 mb-10 max-w-2xl">
        Every piece in our collection, made for modern homes in Dhaka.
      </p>
      <ProductListing
        basePath={BASE_PATH}
        query={query}
        listing={listing}
        emptyMessage="Our collection is on its way."
      />
    </>
  );
}

export default function ProductsPage({ searchParams }: PageProps<"/products">) {
  return (
    <Container className="py-8 md:py-12">
      <Suspense fallback={<ListingSkeleton />}>
        <AllProducts searchParams={searchParams} />
      </Suspense>
    </Container>
  );
}
