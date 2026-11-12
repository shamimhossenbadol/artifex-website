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
