// Catalogue reads: nav categories, product listings, product detail and related products.
// Request-time wrappers (connection()) around "use cache" loaders with tags from 02 §6 (ADR-020).
import { cacheLife, cacheTag } from "next/cache";
import { connection } from "next/server";
import { PRODUCTS_PER_PAGE, type ListingQuery } from "@/lib/validation/catalog";
import {
  findActiveCategoriesForNav,
  findActiveCategoryBySlug,
} from "@/server/repositories/category.repo";
import {
  findPublishedBySlug,
  findPublishedCards,
  findRelatedCards,
  type ProductCardRow,
  type ProductDetailRow,
} from "@/server/repositories/product.repo";

// ---------- View models ----------

export type NavCategory = {
  name: string;
  slug: string;
  href: string;
  imagePath: string | null;
};

export type ProductImageVM = { path: string; alt: string; width: number; height: number };

export type ProductCardVM = {
  id: number;
  title: string;
  slug: string;
  href: string;
  categoryName: string;
  regularPrice: number | null;
  discountPrice: number | null;
  isNewArrival: boolean;
  isMadeToOrder: boolean;
  image: ProductImageVM | null;
};

export type CategoryVM = {
  id: number;
  name: string;
  slug: string;
  href: string;
  description: string | null;
  imagePath: string | null;
  seoTitle: string | null;
  seoDescription: string | null;
};

export type ProductListing = {
  items: ProductCardVM[];
  total: number;
  page: number;
  pageCount: number;
};

export type ProductDetailVM = Omit<ProductDetailRow, "images" | "category" | "categoryId"> & {
  href: string;
  category: { id: number; name: string; slug: string; href: string };
  images: (ProductImageVM & { id: number })[];
};

export function productHref(slug: string): string {
  return `/products/${slug}`;
}

export function categoryHref(slug: string): string {
  return `/categories/${slug}`;
}

export function toCardVM(row: ProductCardRow): ProductCardVM {
  const image = row.images[0];
  return {
    id: row.id,
    title: row.title,
    slug: row.slug,
    href: productHref(row.slug),
    categoryName: row.category.name,
    regularPrice: row.regularPrice,
    discountPrice: row.discountPrice,
    isNewArrival: row.isNewArrival,
    isMadeToOrder: row.isMadeToOrder,
    image: image ? { ...image } : null,
  };
}

// ---------- Cached loaders (private) ----------

async function loadNavCategories(): Promise<NavCategory[]> {
  "use cache";
  cacheTag("categories");
  cacheLife("hours");
  const rows = await findActiveCategoriesForNav();
  return rows.map((c) => ({
    name: c.name,
    slug: c.slug,
    href: categoryHref(c.slug),
    imagePath: c.imagePath,
  }));
}

async function loadCategory(slug: string): Promise<CategoryVM | null> {
  "use cache";
  cacheTag("categories", `category:${slug}`);
  cacheLife("hours");
  const row = await findActiveCategoryBySlug(slug);
  return row ? { ...row, href: categoryHref(row.slug) } : null;
}

async function loadListing(
  categoryId: number | null,
  query: ListingQuery,
): Promise<ProductListing> {
  "use cache";
  cacheTag("products", "categories");
  cacheLife("hours");
  const { total, rows } = await findPublishedCards({
    categoryId: categoryId ?? undefined,
    onSale: query.onSale,
    sort: query.sort,
    skip: (query.page - 1) * PRODUCTS_PER_PAGE,
    take: PRODUCTS_PER_PAGE,
  });
  return {
    items: rows.map(toCardVM),
    total,
    page: query.page,
    pageCount: Math.max(1, Math.ceil(total / PRODUCTS_PER_PAGE)),
  };
}

async function loadProduct(slug: string): Promise<ProductDetailVM | null> {
  "use cache";
  cacheTag("products", `product:${slug}`);
  cacheLife("hours");
  const row = await findPublishedBySlug(slug);
  if (!row) return null;
  const { images, category, categoryId, ...rest } = row;
  return {
    ...rest,
    href: productHref(row.slug),
    category: { id: categoryId, ...category, href: categoryHref(category.slug) },
    images: images.map((i) => ({ ...i })),
  };
}

async function loadRelated(productId: number, categoryId: number): Promise<ProductCardVM[]> {
  "use cache";
  cacheTag("products");
  cacheLife("hours");
  return (await findRelatedCards(productId, categoryId, 4)).map(toCardVM);
}

// ---------- Public, request-time API ----------

/** Active categories for the header, mobile menu and footer. Never throws (falls back to []). */
export async function getNavCategories(): Promise<NavCategory[]> {
  await connection();
  try {
    return await loadNavCategories();
  } catch (err) {
    console.error("[catalog.getNavCategories]", err);
    return [];
  }
}

export async function getCategoryBySlug(slug: string): Promise<CategoryVM | null> {
  await connection();
  return loadCategory(slug);
}

/** One page of published products, optionally within a category (F1.1). */
export async function listProducts(
  query: ListingQuery,
  categoryId: number | null = null,
): Promise<ProductListing> {
  await connection();
  return loadListing(categoryId, query);
}

export async function getProductBySlug(slug: string): Promise<ProductDetailVM | null> {
  await connection();
  return loadProduct(slug);
}

export async function getRelatedProducts(
  productId: number,
  categoryId: number,
): Promise<ProductCardVM[]> {
  await connection();
  try {
    return await loadRelated(productId, categoryId);
  } catch (err) {
    console.error("[catalog.getRelatedProducts]", { productId }, err);
    return [];
  }
}
