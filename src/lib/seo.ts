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

/** Organization (home, 08 §2): name, logo and social profiles. */
export function organizationJsonLd(
  o: { name: string; sameAs: string[] },
  siteUrl: string = SITE_URL,
): JsonLdObject {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: o.name,
    url: absoluteUrl("/", siteUrl),
    logo: absoluteUrl("/logo-mark-512.png", siteUrl),
    ...(o.sameAs.length > 0 ? { sameAs: o.sameAs } : {}),
  };
}

/** WebSite with a SearchAction → /search?q= (08 §2), enabling a sitelinks search box. */
export function websiteJsonLd(name: string, siteUrl: string = SITE_URL): JsonLdObject {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name,
    url: absoluteUrl("/", siteUrl),
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${absoluteUrl("/search", siteUrl)}?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };
}

export type LocalBusinessInput = {
  name: string;
  phone: string | null;
  email: string | null;
  addressLine: string;
  city: string;
  latitude: number | null;
  longitude: number | null;
  mapLinkUrl: string | null;
  sameAs: string[];
  openingHoursSpecification: JsonLdObject[];
};

/** FurnitureStore (LocalBusiness) for the contact page and home (08 §2). */
export function localBusinessJsonLd(
  b: LocalBusinessInput,
  siteUrl: string = SITE_URL,
): JsonLdObject {
  const postalCode = /\b(\d{4})\b/.exec(b.city)?.[1];
  const locality = b.city.replace(/\b\d{4}\b/, "").trim() || "Dhaka";
  return {
    "@context": "https://schema.org",
    "@type": "FurnitureStore",
    name: b.name,
    url: absoluteUrl("/", siteUrl),
    image: absoluteUrl("/logo-mark-512.png", siteUrl),
    ...(b.phone ? { telephone: b.phone.replace(/[^\d+]/g, "") } : {}),
    ...(b.email ? { email: b.email } : {}),
    address: {
      "@type": "PostalAddress",
      streetAddress: b.addressLine,
      addressLocality: locality,
      ...(postalCode ? { postalCode } : {}),
      addressCountry: "BD",
    },
    ...(b.latitude !== null && b.longitude !== null
      ? { geo: { "@type": "GeoCoordinates", latitude: b.latitude, longitude: b.longitude } }
      : {}),
    ...(b.mapLinkUrl ? { hasMap: b.mapLinkUrl } : {}),
    ...(b.sameAs.length > 0 ? { sameAs: b.sameAs } : {}),
    ...(b.openingHoursSpecification.length > 0
      ? { openingHoursSpecification: b.openingHoursSpecification }
      : {}),
  };
}

export type ArticleJsonLdInput = {
  title: string;
  description: string;
  path: string;
  coverPath: string | null;
  authorName: string;
  publishedAt: Date;
  updatedAt: Date;
};

/** BlogPosting for Journal posts (08 §2). */
export function articleJsonLd(
  a: ArticleJsonLdInput,
  siteUrl: string = SITE_URL,
  mediaUrl?: string,
): JsonLdObject {
  return {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: a.title,
    description: a.description,
    url: absoluteUrl(a.path, siteUrl),
    mainEntityOfPage: absoluteUrl(a.path, siteUrl),
    ...(a.coverPath ? { image: [absoluteImageUrl(a.coverPath, siteUrl, mediaUrl)] } : {}),
    datePublished: a.publishedAt.toISOString(),
    dateModified: a.updatedAt.toISOString(),
    author: { "@type": "Organization", name: a.authorName },
    publisher: {
      "@type": "Organization",
      name: SITE_NAME,
      logo: { "@type": "ImageObject", url: absoluteUrl("/logo-mark-512.png", siteUrl) },
    },
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
