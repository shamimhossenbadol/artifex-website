// Admin dashboard counts and lists (07 §3.1). Uncached: the admin always sees current data.
import { db } from "@/lib/db";

export async function findDashboardCounts() {
  const [published, drafts, categories, posts, withoutImages] = await db.$transaction([
    db.product.count({ where: { status: "PUBLISHED" } }),
    db.product.count({ where: { status: "DRAFT" } }),
    db.category.count(),
    db.blogPost.count({ where: { status: "PUBLISHED" } }),
    db.product.count({ where: { images: { none: {} } } }),
  ]);
  return { published, drafts, categories, posts, withoutImages };
}

export function findRecentlyUpdatedProducts(take = 5) {
  return db.product.findMany({
    orderBy: { updatedAt: "desc" },
    take,
    select: {
      id: true,
      title: true,
      slug: true,
      status: true,
      updatedAt: true,
      category: { select: { name: true } },
    },
  });
}

export async function findDashboardSettings() {
  const [settings, heroSlides] = await Promise.all([
    db.siteSetting.findUnique({ where: { id: 1 }, select: { whatsappNumber: true } }),
    db.homeHeroSlide.count(),
  ]);
  return { whatsappNumber: settings?.whatsappNumber ?? "", heroSlides };
}
