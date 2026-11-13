// Sitemap sources (08 §7): only what the public site shows.
import { db } from "@/lib/db";

export async function findSitemapEntries() {
  const [categories, products, posts] = await db.$transaction([
    db.category.findMany({
      where: { isActive: true },
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
      select: { slug: true, updatedAt: true },
    }),
    db.product.findMany({
      where: { status: "PUBLISHED", category: { isActive: true } },
      orderBy: { id: "asc" },
      select: { slug: true, updatedAt: true },
    }),
    db.blogPost.findMany({
      where: { status: "PUBLISHED", publishedAt: { not: null } },
      orderBy: { id: "asc" },
      select: { slug: true, updatedAt: true },
    }),
  ]);
  return { categories, products, posts };
}
