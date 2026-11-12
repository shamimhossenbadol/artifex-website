// Catalogue reads (categories now; products from Phase 3). Cached with tags from 02 §6.
import { cacheLife, cacheTag } from "next/cache";
import { connection } from "next/server";
import { findActiveCategoriesForNav } from "@/server/repositories/category.repo";

export type NavCategory = {
  name: string;
  slug: string;
  href: string;
  imagePath: string | null;
};

async function loadNavCategories(): Promise<NavCategory[]> {
  "use cache";
  cacheTag("categories");
  cacheLife("hours");
  const rows = await findActiveCategoriesForNav();
  return rows.map((c) => ({
    name: c.name,
    slug: c.slug,
    href: `/categories/${c.slug}`,
    imagePath: c.imagePath,
  }));
}

/** Active categories for the header, mobile menu and footer (request-time, cached; ADR-020). */
export async function getNavCategories(): Promise<NavCategory[]> {
  await connection();
  try {
    return await loadNavCategories();
  } catch (err) {
    console.error("[catalog.getNavCategories]", err);
    return [];
  }
}
