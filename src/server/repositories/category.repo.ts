// Category queries. Repositories return plain objects with explicit selects (11 §6).
import { db } from "@/lib/db";

/** Active categories for navigation, in the admin-defined order. */
export async function findActiveCategoriesForNav() {
  return db.category.findMany({
    where: { isActive: true },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    select: { id: true, name: true, slug: true, imagePath: true },
  });
}

export type NavCategoryRow = Awaited<ReturnType<typeof findActiveCategoriesForNav>>[number];

/** Active categories whose name contains the (LIKE-escaped) query, for search suggestions. */
export async function findActiveCategoriesMatching(escapedQuery: string, take: number) {
  return db.category.findMany({
    where: { isActive: true, name: { contains: escapedQuery } },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    take,
    select: { name: true, slug: true },
  });
}

/** An active category by slug, for its listing page (hidden categories 404). */
export async function findActiveCategoryBySlug(slug: string) {
  return db.category.findFirst({
    where: { slug, isActive: true },
    select: {
      id: true,
      name: true,
      slug: true,
      description: true,
      imagePath: true,
      seoTitle: true,
      seoDescription: true,
    },
  });
}

export type CategoryRow = NonNullable<Awaited<ReturnType<typeof findActiveCategoryBySlug>>>;
