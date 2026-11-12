// Global search (F2): instant suggestions and the paginated results page. Candidates (≤ 200) are
// fetched with AND-of-LIKE on searchText, ranked in memory, and cached per normalised query.
import { cacheLife, cacheTag } from "next/cache";
import { connection } from "next/server";
import { escapeLike, isSearchable, normalizeQuery, rankProducts, splitTerms } from "@/lib/search";
import { PRODUCTS_PER_PAGE } from "@/lib/validation/catalog";
import { findActiveCategoriesMatching } from "@/server/repositories/category.repo";
import { findSearchCandidates } from "@/server/repositories/product.repo";
import { categoryHref, toCardVM, type ProductCardVM, type ProductListing } from "./catalog.service";

export const SUGGESTION_PRODUCTS = 6;
export const SUGGESTION_CATEGORIES = 3;

export type SearchSuggestions = {
  query: string;
  products: Pick<
    ProductCardVM,
    "title" | "href" | "regularPrice" | "discountPrice" | "image" | "categoryName"
  >[];
  categories: { name: string; href: string }[];
};

type SearchResult = { products: ProductCardVM[]; categories: { name: string; href: string }[] };

async function loadSearch(normalized: string): Promise<SearchResult> {
  "use cache";
  cacheTag("products", "categories");
  cacheLife("hours");
  const terms = splitTerms(normalized).map(escapeLike);
  const [rows, categories] = await Promise.all([
    findSearchCandidates(terms),
    findActiveCategoriesMatching(escapeLike(normalized), SUGGESTION_CATEGORIES),
  ]);
  return {
    products: rankProducts(rows, normalized).map(toCardVM),
    categories: categories.map((c) => ({ name: c.name, href: categoryHref(c.slug) })),
  };
}

/** Instant suggestions for the header overlay: up to 6 products and 3 categories. */
export async function getSearchSuggestions(rawQuery: string): Promise<SearchSuggestions> {
  await connection();
  const query = normalizeQuery(rawQuery);
  if (!isSearchable(query)) return { query, products: [], categories: [] };
  const result = await loadSearch(query);
  return {
    query,
    products: result.products.slice(0, SUGGESTION_PRODUCTS).map((p) => ({
      title: p.title,
      href: p.href,
      regularPrice: p.regularPrice,
      discountPrice: p.discountPrice,
      image: p.image,
      categoryName: p.categoryName,
    })),
    categories: result.categories,
  };
}

/** One page of ranked results for /search (24 per page, like other listings). */
export async function searchProducts(rawQuery: string, page: number): Promise<ProductListing> {
  await connection();
  const query = normalizeQuery(rawQuery);
  if (!isSearchable(query)) return { items: [], total: 0, page: 1, pageCount: 1 };
  const { products } = await loadSearch(query);
  const start = (page - 1) * PRODUCTS_PER_PAGE;
  return {
    items: products.slice(start, start + PRODUCTS_PER_PAGE),
    total: products.length,
    page,
    pageCount: Math.max(1, Math.ceil(products.length / PRODUCTS_PER_PAGE)),
  };
}
