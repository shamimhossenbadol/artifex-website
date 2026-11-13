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

/** Categories for the homepage "Shop by category" tiles (F6). */
export async function findHomeCategories() {
  return db.category.findMany({
    where: { isActive: true, showOnHome: true },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    select: { name: true, slug: true, imagePath: true },
  });
}

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

// --- Admin (07 §3.3) ---------------------------------------------------------------------------

const CATEGORY_ADMIN_SELECT = {
  id: true,
  name: true,
  slug: true,
  description: true,
  imagePath: true,
  isActive: true,
  showOnHome: true,
  sortOrder: true,
  seoTitle: true,
  seoDescription: true,
  updatedAt: true,
  _count: { select: { products: true } },
} as const;

export async function findAllCategoriesForAdmin() {
  return db.category.findMany({
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    take: 200,
    select: CATEGORY_ADMIN_SELECT,
  });
}

export async function findCategoryById(id: number) {
  return db.category.findUnique({ where: { id }, select: CATEGORY_ADMIN_SELECT });
}

export type AdminCategoryRow = NonNullable<Awaited<ReturnType<typeof findCategoryById>>>;

/** The id of the category using this slug, if any (for the uniqueness check). */
export async function findCategoryIdBySlug(slug: string): Promise<number | null> {
  const row = await db.category.findUnique({ where: { slug }, select: { id: true } });
  return row?.id ?? null;
}

export type CategoryData = {
  name: string;
  slug: string;
  description: string | null;
  imagePath: string | null;
  isActive: boolean;
  showOnHome: boolean;
  seoTitle: string | null;
  seoDescription: string | null;
};

/** New categories go to the end of the list. */
export async function createCategory(data: CategoryData): Promise<number> {
  const last = await db.category.aggregate({ _max: { sortOrder: true } });
  const row = await db.category.create({
    data: { ...data, sortOrder: (last._max.sortOrder ?? 0) + 10 },
    select: { id: true },
  });
  return row.id;
}

export async function updateCategory(id: number, data: CategoryData): Promise<void> {
  await db.category.update({ where: { id }, data });
}

export async function setCategoryFlag(
  id: number,
  flag: "isActive" | "showOnHome",
  value: boolean,
): Promise<void> {
  await db.category.update({ where: { id }, data: { [flag]: value } });
}

export async function deleteCategory(id: number): Promise<void> {
  await db.category.delete({ where: { id } });
}

export async function countProductsInCategory(categoryId: number): Promise<number> {
  return db.product.count({ where: { categoryId } });
}

/** Rewrites sortOrder as 10, 20, 30… in the given id order, in one transaction. */
export async function reorderCategories(ids: number[]): Promise<void> {
  await db.$transaction(
    ids.map((id, index) =>
      db.category.update({ where: { id }, data: { sortOrder: (index + 1) * 10 } }),
    ),
  );
}

/** The fields product search text is built from, for every product in a category (04 §4). */
export async function findProductSearchSources(categoryId: number) {
  return db.product.findMany({
    where: { categoryId },
    select: {
      id: true,
      title: true,
      keywords: true,
      material: true,
      colors: { orderBy: { sortOrder: "asc" }, select: { name: true } },
    },
  });
}

/** Writes recomputed search text, in batched transactions. */
export async function updateProductSearchTexts(
  rows: { id: number; searchText: string }[],
): Promise<void> {
  const BATCH = 100;
  for (let i = 0; i < rows.length; i += BATCH) {
    await db.$transaction(
      rows
        .slice(i, i + BATCH)
        .map((r) => db.product.update({ where: { id: r.id }, data: { searchText: r.searchText } })),
    );
  }
}
