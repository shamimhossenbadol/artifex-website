// Product queries. Listing queries select only card fields + the primary image (08 §6).
import { db } from "@/lib/db";
import type { Prisma } from "@/generated/prisma/client";
import type { ProductSort } from "@/lib/validation/catalog";

const PUBLISHED_IN_ACTIVE_CATEGORY = {
  status: "PUBLISHED",
  category: { isActive: true },
} satisfies Prisma.ProductWhereInput;

export const PRODUCT_CARD_SELECT = {
  id: true,
  title: true,
  slug: true,
  regularPrice: true,
  discountPrice: true,
  isNewArrival: true,
  isMadeToOrder: true,
  category: { select: { name: true, slug: true } },
  images: {
    where: { isPrimary: true },
    take: 1,
    select: { path: true, alt: true, width: true, height: true },
  },
} satisfies Prisma.ProductSelect;

export type ProductCardRow = Prisma.ProductGetPayload<{ select: typeof PRODUCT_CARD_SELECT }>;

const ORDER_BY: Record<ProductSort, Prisma.ProductOrderByWithRelationInput[]> = {
  newest: [{ publishedAt: "desc" }, { id: "desc" }],
  // "Price on request" (null) goes last in both directions (F1.1).
  price_asc: [{ effectivePrice: { sort: "asc", nulls: "last" } }, { id: "desc" }],
  price_desc: [{ effectivePrice: { sort: "desc", nulls: "last" } }, { id: "desc" }],
};

export async function findPublishedCards(options: {
  categoryId?: number;
  onSale: boolean;
  sort: ProductSort;
  skip: number;
  take: number;
}): Promise<{ total: number; rows: ProductCardRow[] }> {
  const where: Prisma.ProductWhereInput = {
    ...PUBLISHED_IN_ACTIVE_CATEGORY,
    ...(options.categoryId !== undefined ? { categoryId: options.categoryId } : {}),
    ...(options.onSale ? { discountPrice: { not: null } } : {}),
  };
  const [total, rows] = await db.$transaction([
    db.product.count({ where }),
    db.product.findMany({
      where,
      orderBy: ORDER_BY[options.sort],
      skip: options.skip,
      take: options.take,
      select: PRODUCT_CARD_SELECT,
    }),
  ]);
  return { total, rows };
}

export const PRODUCT_DETAIL_SELECT = {
  id: true,
  title: true,
  slug: true,
  shortDescription: true,
  description: true,
  regularPrice: true,
  discountPrice: true,
  sku: true,
  material: true,
  dimensions: true,
  isMadeToOrder: true,
  isNewArrival: true,
  seoTitle: true,
  seoDescription: true,
  publishedAt: true,
  updatedAt: true,
  categoryId: true,
  category: { select: { name: true, slug: true } },
  images: {
    orderBy: [{ isPrimary: "desc" }, { sortOrder: "asc" }, { id: "asc" }],
    select: { id: true, path: true, alt: true, width: true, height: true },
  },
  colors: { orderBy: { sortOrder: "asc" }, select: { id: true, name: true, hex: true } },
  specs: { orderBy: { sortOrder: "asc" }, select: { id: true, label: true, value: true } },
} satisfies Prisma.ProductSelect;

export type ProductDetailRow = Prisma.ProductGetPayload<{ select: typeof PRODUCT_DETAIL_SELECT }>;

export async function findPublishedBySlug(slug: string): Promise<ProductDetailRow | null> {
  return db.product.findFirst({
    where: { slug, ...PUBLISHED_IN_ACTIVE_CATEGORY },
    select: PRODUCT_DETAIL_SELECT,
  });
}

/** Any status, any category state: only for a signed-in admin's draft preview (F1.2). */
export async function findAnyProductBySlug(slug: string): Promise<ProductDetailRow | null> {
  return db.product.findUnique({ where: { slug }, select: PRODUCT_DETAIL_SELECT });
}

export type HomeRail = "new" | "featured" | "popular";

/**
 * Homepage rails (F6): featured/popular by the admin's homeSortOrder; new arrivals by the flag,
 * newest first, falling back to the newest products when none are flagged.
 */
export async function findHomeRail(rail: HomeRail, take: number): Promise<ProductCardRow[]> {
  if (rail === "new") {
    const flagged = await db.product.findMany({
      where: { ...PUBLISHED_IN_ACTIVE_CATEGORY, isNewArrival: true },
      orderBy: [{ publishedAt: "desc" }, { id: "desc" }],
      take,
      select: PRODUCT_CARD_SELECT,
    });
    if (flagged.length > 0) return flagged;
    return db.product.findMany({
      where: PUBLISHED_IN_ACTIVE_CATEGORY,
      orderBy: [{ publishedAt: "desc" }, { id: "desc" }],
      take,
      select: PRODUCT_CARD_SELECT,
    });
  }
  return db.product.findMany({
    where: {
      ...PUBLISHED_IN_ACTIVE_CATEGORY,
      ...(rail === "featured" ? { isFeatured: true } : { isPopular: true }),
    },
    orderBy: [{ homeSortOrder: "asc" }, { publishedAt: "desc" }],
    take,
    select: PRODUCT_CARD_SELECT,
  });
}

export const SEARCH_CANDIDATE_LIMIT = 200;

/**
 * Search candidates (F2): every term must appear in searchText (AND of LIKE %term%). Terms must
 * already be LIKE-escaped (src/lib/search.ts → escapeLike). Ranking happens in the service.
 */
export async function findSearchCandidates(escapedTerms: string[]) {
  return db.product.findMany({
    where: {
      ...PUBLISHED_IN_ACTIVE_CATEGORY,
      AND: escapedTerms.map((term) => ({ searchText: { contains: term } })),
    },
    orderBy: [{ isPopular: "desc" }, { publishedAt: "desc" }],
    take: SEARCH_CANDIDATE_LIMIT,
    select: { ...PRODUCT_CARD_SELECT, isPopular: true, publishedAt: true },
  });
}

/** Up to `take` related products: same category first, then popular ones elsewhere (F1.6). */
export async function findRelatedCards(
  productId: number,
  categoryId: number,
  take: number,
): Promise<ProductCardRow[]> {
  const sameCategory = await db.product.findMany({
    where: { ...PUBLISHED_IN_ACTIVE_CATEGORY, categoryId, id: { not: productId } },
    orderBy: [{ isPopular: "desc" }, { publishedAt: "desc" }],
    take,
    select: PRODUCT_CARD_SELECT,
  });
  if (sameCategory.length >= take) return sameCategory;

  const fill = await db.product.findMany({
    where: {
      ...PUBLISHED_IN_ACTIVE_CATEGORY,
      id: { notIn: [productId, ...sameCategory.map((p) => p.id)] },
    },
    orderBy: [{ isPopular: "desc" }, { publishedAt: "desc" }],
    take: take - sameCategory.length,
    select: PRODUCT_CARD_SELECT,
  });
  return [...sameCategory, ...fill];
}
