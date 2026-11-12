// Homepage content queries (F6): hero singleton and promo banners.
import { db } from "@/lib/db";

export async function findHomeHero() {
  return db.homeHero.findUnique({
    where: { id: 1 },
    select: {
      eyebrow: true,
      heading: true,
      subheading: true,
      imagePath: true,
      imageAlt: true,
      ctaLabel: true,
      ctaHref: true,
      secondaryLabel: true,
      secondaryHref: true,
    },
  });
}

export type HomeHeroRow = NonNullable<Awaited<ReturnType<typeof findHomeHero>>>;

/** Active banners in admin order; the date window is applied at request time by the service. */
export async function findActiveBanners() {
  return db.promoBanner.findMany({
    where: { isActive: true },
    orderBy: [{ sortOrder: "asc" }, { id: "asc" }],
    take: 10,
    select: {
      id: true,
      title: true,
      subtitle: true,
      imagePath: true,
      imageAlt: true,
      linkHref: true,
      linkLabel: true,
      startsAt: true,
      endsAt: true,
    },
  });
}

export type PromoBannerRow = Awaited<ReturnType<typeof findActiveBanners>>[number];
