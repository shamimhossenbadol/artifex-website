// Homepage content queries (F6): hero singleton, hero slides (ADR-039) and promo banners.
import { db } from "@/lib/db";

export async function findHomeHero() {
  return db.homeHero.findUnique({
    where: { id: 1 },
    select: {
      eyebrow: true,
      heading: true,
      subheading: true,
      ctaLabel: true,
      ctaHref: true,
      secondaryLabel: true,
      secondaryHref: true,
    },
  });
}

export type HomeHeroRow = NonNullable<Awaited<ReturnType<typeof findHomeHero>>>;

/** Hero slides in admin order (public and admin). */
export async function findHeroSlides() {
  return db.homeHeroSlide.findMany({
    orderBy: [{ sortOrder: "asc" }, { id: "asc" }],
    take: 20,
    select: { id: true, imagePath: true, imageAlt: true },
  });
}

export type HeroSlideRow = Awaited<ReturnType<typeof findHeroSlides>>[number];

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

// --- Admin (07 §3.5) ---------------------------------------------------------------------------

export type HeroData = {
  eyebrow: string | null;
  heading: string;
  subheading: string | null;
  ctaLabel: string;
  ctaHref: string;
  secondaryLabel: string | null;
  secondaryHref: string | null;
};

export async function saveHomeHero(data: HeroData): Promise<void> {
  await db.homeHero.upsert({ where: { id: 1 }, update: data, create: { ...data, id: 1 } });
}

export async function countHeroSlides(): Promise<number> {
  return db.homeHeroSlide.count();
}

export async function findHeroSlide(id: number): Promise<HeroSlideRow | null> {
  return db.homeHeroSlide.findUnique({
    where: { id },
    select: { id: true, imagePath: true, imageAlt: true },
  });
}

/** New slides go to the end. */
export async function insertHeroSlide(data: {
  imagePath: string;
  imageAlt: string;
}): Promise<HeroSlideRow> {
  const last = await db.homeHeroSlide.aggregate({ _max: { sortOrder: true } });
  return db.homeHeroSlide.create({
    data: { ...data, sortOrder: (last._max.sortOrder ?? 0) + 10 },
    select: { id: true, imagePath: true, imageAlt: true },
  });
}

export async function updateHeroSlideAlt(id: number, imageAlt: string): Promise<void> {
  await db.homeHeroSlide.update({ where: { id }, data: { imageAlt } });
}

export async function deleteHeroSlide(id: number): Promise<void> {
  await db.homeHeroSlide.delete({ where: { id } });
}

/** Rewrites sortOrder as 10, 20, 30… in the given id order, in one transaction. */
export async function reorderHeroSlides(ids: number[]): Promise<void> {
  await db.$transaction(
    ids.map((id, index) =>
      db.homeHeroSlide.update({ where: { id }, data: { sortOrder: (index + 1) * 10 } }),
    ),
  );
}

const BANNER_ADMIN_SELECT = {
  id: true,
  title: true,
  subtitle: true,
  imagePath: true,
  imageAlt: true,
  linkHref: true,
  linkLabel: true,
  isActive: true,
  startsAt: true,
  endsAt: true,
  sortOrder: true,
  updatedAt: true,
} as const;

export async function findAllBanners() {
  return db.promoBanner.findMany({
    orderBy: [{ sortOrder: "asc" }, { id: "asc" }],
    take: 100,
    select: BANNER_ADMIN_SELECT,
  });
}

export async function findBannerById(id: number) {
  return db.promoBanner.findUnique({ where: { id }, select: BANNER_ADMIN_SELECT });
}

export type AdminBannerRow = NonNullable<Awaited<ReturnType<typeof findBannerById>>>;

export type BannerData = {
  title: string;
  subtitle: string | null;
  imagePath: string;
  imageAlt: string;
  linkHref: string | null;
  linkLabel: string | null;
  isActive: boolean;
  startsAt: Date | null;
  endsAt: Date | null;
};

/** New banners go to the end of the list. */
export async function createBanner(data: BannerData): Promise<number> {
  const last = await db.promoBanner.aggregate({ _max: { sortOrder: true } });
  const row = await db.promoBanner.create({
    data: { ...data, sortOrder: (last._max.sortOrder ?? 0) + 10 },
    select: { id: true },
  });
  return row.id;
}

export async function updateBanner(id: number, data: BannerData): Promise<void> {
  await db.promoBanner.update({ where: { id }, data });
}

export async function deleteBanner(id: number): Promise<void> {
  await db.promoBanner.delete({ where: { id } });
}

/** Rewrites sortOrder as 10, 20, 30… in the given id order, in one transaction. */
export async function reorderBanners(ids: number[]): Promise<void> {
  await db.$transaction(
    ids.map((id, index) =>
      db.promoBanner.update({ where: { id }, data: { sortOrder: (index + 1) * 10 } }),
    ),
  );
}
