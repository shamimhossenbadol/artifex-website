import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { Gallery } from "@/components/product/Gallery";
import { ProductGrid } from "@/components/product/ProductGrid";
import { ProductInquiry } from "@/components/product/ProductInquiry";
import { SectionHeading } from "@/components/site/SectionHeading";
import { getContactLinks } from "@/components/site/contact-links";
import { Badge } from "@/components/ui/Badge";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { Container } from "@/components/ui/Container";
import { JsonLd } from "@/components/ui/JsonLd";
import { Markdown } from "@/components/ui/Markdown";
import { Price } from "@/components/ui/Price";
import { Skeleton } from "@/components/ui/Skeleton";
import { formatBDT, getPriceInfo } from "@/lib/format";
import { absoluteImageUrl, absoluteUrl, breadcrumbJsonLd, productJsonLd } from "@/lib/seo";
import { slugSchema } from "@/lib/validation/catalog";
import {
  getProductBySlug,
  getRelatedProducts,
  type ProductDetailVM,
} from "@/server/services/catalog.service";
import { getSiteSettings } from "@/server/services/settings.service";

type Props = PageProps<"/products/[slug]">;

async function loadProduct(params: Props["params"]): Promise<ProductDetailVM | null> {
  const { slug } = await params;
  if (!slugSchema.safeParse(slug).success) return null;
  return getProductBySlug(slug);
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const product = await loadProduct(params);
  if (!product) return { title: "Product not found", robots: { index: false } };
  const primary = product.images[0];
  return {
    title: product.seoTitle ?? `${product.title} — ${product.category.name}`,
    description: product.seoDescription ?? product.shortDescription,
    alternates: { canonical: product.href },
    openGraph: {
      type: "website",
      title: product.title,
      description: product.shortDescription,
      url: product.href,
      ...(primary ? { images: [{ url: absoluteImageUrl(primary.path), alt: primary.alt }] } : {}),
    },
  };
}

function priceLabel(regular: number | null, discount: number | null): string {
  const info = getPriceInfo(regular, discount);
  return info.kind === "onRequest" ? "Price on request" : formatBDT(info.price);
}

async function ProductDetail({ params }: Pick<Props, "params">) {
  const [product, settings] = await Promise.all([loadProduct(params), getSiteSettings()]);
  if (!product) notFound();
  const { phone, telHref } = getContactLinks(settings);
  const hasWhatsApp = settings.whatsappNumber.replace(/\D/g, "").length >= 8;

  const facts = [
    { label: "Material", value: product.material },
    { label: "Dimensions", value: product.dimensions },
  ].filter((f): f is { label: string; value: string } => Boolean(f.value));

  return (
    <>
      <JsonLd
        data={[
          productJsonLd({
            title: product.title,
            description: product.shortDescription,
            path: product.href,
            sku: product.sku,
            categoryName: product.category.name,
            regularPrice: product.regularPrice,
            discountPrice: product.discountPrice,
            isMadeToOrder: product.isMadeToOrder,
            imagePaths: product.images.map((i) => i.path),
          }),
          breadcrumbJsonLd([
            { name: "Home", path: "/" },
            { name: product.category.name, path: product.category.href },
            { name: product.title, path: product.href },
          ]),
        ]}
      />

      <div className="grid gap-8 lg:grid-cols-12 lg:gap-12">
        <div className="lg:col-span-7">
          <Gallery images={product.images} title={product.title} />
        </div>

        <div className="lg:col-span-5">
          <div className="lg:sticky lg:top-24">
            <Breadcrumbs
              items={[
                { label: "Home", href: "/" },
                { label: product.category.name, href: product.category.href },
                { label: product.title },
              ]}
            />
            <Link
              href={product.category.href}
              className="text-eyebrow text-walnut mt-6 inline-flex min-h-8 items-center"
            >
              {product.category.name}
            </Link>
            <h1 className="text-h1 mt-2">{product.title}</h1>
            <Price
              regularPrice={product.regularPrice}
              discountPrice={product.discountPrice}
              showBadge
              className="mt-4"
            />
            {product.isMadeToOrder && (
              <p className="text-small mt-3 flex items-center gap-2">
                <Badge>Made to order</Badge>
                Sizes and finishes can be tailored to your space.
              </p>
            )}

            <ProductInquiry
              colors={product.colors}
              whatsappNumber={hasWhatsApp ? settings.whatsappNumber : null}
              template={settings.whatsappProductTemplate}
              business={settings.businessName}
              productTitle={product.title}
              productUrl={absoluteUrl(product.href)}
              priceLabel={priceLabel(product.regularPrice, product.discountPrice)}
              phone={phone}
              telHref={telHref}
            />

            <p className="text-body-lg mt-8">{product.shortDescription}</p>
            {facts.length > 0 && (
              <dl className="border-line mt-6 grid grid-cols-[auto_1fr] gap-x-6 gap-y-2 border-t pt-6">
                {facts.map((fact) => (
                  <div key={fact.label} className="contents">
                    <dt className="text-small text-muted">{fact.label}</dt>
                    <dd className="text-ink">{fact.value}</dd>
                  </div>
                ))}
              </dl>
            )}
          </div>
        </div>
      </div>

      <div className="border-line mt-16 grid gap-12 border-t pt-12 lg:grid-cols-12">
        {product.description.trim() && (
          <section aria-labelledby="description" className="lg:col-span-7">
            <h2 id="description" className="text-h2 mb-6">
              Description
            </h2>
            <Markdown>{product.description}</Markdown>
          </section>
        )}
        {product.specs.length > 0 && (
          <section aria-labelledby="specifications" className="lg:col-span-5">
            <h2 id="specifications" className="text-h2 mb-6">
              Specifications
            </h2>
            <dl className="divide-line border-line divide-y border-y">
              {product.specs.map((spec) => (
                <div
                  key={spec.id}
                  className="grid grid-cols-[minmax(0,2fr)_minmax(0,3fr)] gap-4 py-3"
                >
                  <dt className="text-small text-muted">{spec.label}</dt>
                  <dd className="text-ink">{spec.value}</dd>
                </div>
              ))}
            </dl>
          </section>
        )}
      </div>

      <Suspense fallback={null}>
        <RelatedProducts productId={product.id} categoryId={product.category.id} />
      </Suspense>
    </>
  );
}

async function RelatedProducts({
  productId,
  categoryId,
}: {
  productId: number;
  categoryId: number;
}) {
  const related = await getRelatedProducts(productId, categoryId);
  if (related.length === 0) return null;
  return (
    <section aria-labelledby="related" className="reveal mt-20">
      <SectionHeading id="related" eyebrow="You may also like" title="Related pieces" />
      <ProductGrid products={related} preloadFirst={0} />
    </section>
  );
}

function ProductSkeleton() {
  return (
    <div
      aria-busy="true"
      aria-label="Loading product"
      className="grid gap-8 lg:grid-cols-12 lg:gap-12"
    >
      <Skeleton className="-mx-4 aspect-square sm:-mx-6 lg:col-span-7 lg:mx-0 lg:aspect-[4/3]" />
      <div className="flex flex-col gap-4 lg:col-span-5">
        <Skeleton className="h-4 w-48" />
        <Skeleton className="h-12 w-3/4" />
        <Skeleton className="h-6 w-32" />
        <Skeleton className="mt-6 h-13 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
    </div>
  );
}

export default function ProductPage({ params }: Props) {
  return (
    <Container className="py-6 md:py-10">
      <Suspense fallback={<ProductSkeleton />}>
        <ProductDetail params={params} />
      </Suspense>
    </Container>
  );
}
