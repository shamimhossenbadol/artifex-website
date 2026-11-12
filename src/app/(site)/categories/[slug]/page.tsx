import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ListingSkeleton } from "@/components/product/ListingHeaderSkeleton";
import { ProductListing } from "@/components/product/ProductListing";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { Container } from "@/components/ui/Container";
import { JsonLd } from "@/components/ui/JsonLd";
import { absoluteImageUrl, breadcrumbJsonLd } from "@/lib/seo";
import { listingHref, parseListingQuery, slugSchema } from "@/lib/validation/catalog";
import { getCategoryBySlug, listProducts } from "@/server/services/catalog.service";

type Props = PageProps<"/categories/[slug]">;

async function loadCategory(params: Props["params"]) {
  const { slug } = await params;
  if (!slugSchema.safeParse(slug).success) return null;
  return getCategoryBySlug(slug);
}

export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const [category, query] = await Promise.all([
    loadCategory(params),
    searchParams.then(parseListingQuery),
  ]);
  if (!category) return { title: "Category not found", robots: { index: false } };
  const page = query?.page ?? 1;
  const title =
    category.seoTitle ?? `${category.name} — Premium ${category.name.toLowerCase()} in Dhaka`;
  return {
    title: page > 1 ? `${title} (page ${page})` : title,
    description:
      category.seoDescription ??
      category.description ??
      `Browse ${category.name.toLowerCase()} by Artifex Furniture, crafted in Dhaka.`,
    alternates: { canonical: listingHref(category.href, { page }) },
    ...(category.imagePath
      ? { openGraph: { images: [absoluteImageUrl(category.imagePath)] } }
      : {}),
  };
}

async function CategoryContent({ params, searchParams }: Props) {
  const [category, query] = await Promise.all([
    loadCategory(params),
    searchParams.then(parseListingQuery),
  ]);
  if (!category || !query) notFound();
  const listing = await listProducts(query, category.id);
  if (query.page > listing.pageCount) notFound();

  return (
    <>
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Home", path: "/" },
          { name: "All furniture", path: "/products" },
          { name: category.name, path: category.href },
        ])}
      />
      <Breadcrumbs
        items={[
          { label: "Home", href: "/" },
          { label: "All furniture", href: "/products" },
          { label: category.name },
        ]}
      />
      <h1 className="text-h1 mt-6">{category.name}</h1>
      {category.description && (
        <p className="text-body-lg mt-3 mb-10 max-w-2xl">{category.description}</p>
      )}
      {!category.description && <div className="mb-10" />}
      <ProductListing
        basePath={category.href}
        query={query}
        listing={listing}
        emptyMessage={`No ${category.name.toLowerCase()} online yet.`}
        categorySlug={category.slug}
      />
    </>
  );
}

export default function CategoryPage(props: Props) {
  return (
    <Container className="py-8 md:py-12">
      <Suspense fallback={<ListingSkeleton />}>
        <CategoryContent {...props} />
      </Suspense>
    </Container>
  );
}
