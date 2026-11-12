// SEO helpers (08 §1–2): absolute URLs and JSON-LD builders. Pure functions, unit tested.
import { SITE_NAME } from "@/config/site";
import { buildImageUrl, LARGEST_VARIANT_WIDTH } from "@/lib/image-variants";
import { getPriceInfo } from "@/lib/format";

const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/+$/, "");

export function absoluteUrl(path: string, siteUrl: string = SITE_URL): string {
  if (/^https?:\/\//.test(path)) return path;
  return `${siteUrl}${path.startsWith("/") ? "" : "/"}${path}`;
}

/** Absolute URL of the largest variant of a stored image (for JSON-LD and Open Graph). */
export function absoluteImageUrl(
  path: string,
  siteUrl: string = SITE_URL,
  mediaUrl?: string,
): string {
  return absoluteUrl(buildImageUrl(path, LARGEST_VARIANT_WIDTH, mediaUrl), siteUrl);
}

export type JsonLdObject = Record<string, unknown>;

/** JSON for a <script type="application/ld+json">, with "<" escaped so it can't close the tag. */
export function serializeJsonLd(data: JsonLdObject | JsonLdObject[]): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}

export function breadcrumbJsonLd(
  items: { name: string; path: string }[],
  siteUrl: string = SITE_URL,
): JsonLdObject {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: absoluteUrl(item.path, siteUrl),
    })),
  };
}

export type ProductJsonLdInput = {
  title: string;
  description: string;
  path: string;
  sku: string | null;
  categoryName: string;
  regularPrice: number | null;
  discountPrice: number | null;
  isMadeToOrder: boolean;
  imagePaths: string[];
};

/** Product with an Offer in BDT; no offer when the price is on request (08 §2). */
export function productJsonLd(
  p: ProductJsonLdInput,
  siteUrl: string = SITE_URL,
  mediaUrl?: string,
): JsonLdObject {
  const price = getPriceInfo(p.regularPrice, p.discountPrice);
  const url = absoluteUrl(p.path, siteUrl);
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: p.title,
    description: p.description,
    url,
    ...(p.sku ? { sku: p.sku } : {}),
    category: p.categoryName,
    brand: { "@type": "Brand", name: SITE_NAME },
    ...(p.imagePaths.length > 0
      ? { image: p.imagePaths.map((path) => absoluteImageUrl(path, siteUrl, mediaUrl)) }
      : {}),
    ...(price.kind === "onRequest"
      ? {}
      : {
          offers: {
            "@type": "Offer",
            priceCurrency: "BDT",
            price: price.price,
            availability: p.isMadeToOrder
              ? "https://schema.org/PreOrder"
              : "https://schema.org/InStock",
            url,
          },
        }),
  };
}
