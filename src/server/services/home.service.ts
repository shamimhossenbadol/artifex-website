// Homepage data (F6). Each block is cached under its own tags (home, products, categories, blog),
// read at request time (ADR-020). Banner date windows are applied per request, not in the cache.
import { cacheLife, cacheTag } from "next/cache";
import { connection } from "next/server";
import { findHomeCategories } from "@/server/repositories/category.repo";
import {
  findActiveBanners,
  findHeroSlides,
  findHomeHero,
  type PromoBannerRow,
} from "@/server/repositories/home.repo";
import { findNewArrivals } from "@/server/repositories/product.repo";
import { categoryHref, toCardVM, type ProductCardVM } from "./catalog.service";

export const RAIL_SIZE = 8;
export const MAX_BANNERS = 2;
/** Most hero slides the admin can add (ADR-039): each is a full-width photo. */
export const MAX_HERO_SLIDES = 5;

export type HomeHeroVM = {
  eyebrow: string | null;
  heading: string;
  subheading: string | null;
  /** Background photos in order; empty means the typographic hero (05 §3). */
  slides: { path: string; alt: string }[];
  cta: { label: string; href: string };
  secondary: { label: string; href: string } | null;
};

export type HomeCategoryVM = { name: string; slug: string; href: string; imagePath: string | null };
export type PromoBannerVM = Omit<PromoBannerRow, "startsAt" | "endsAt" | "id"> & { id: number };

/** Safe internal or https links only (09 §3). */
function safeHref(href: string | null | undefined): string | null {
  if (!href) return null;
  return href.startsWith("/") || href.startsWith("https://") ? href : null;
}

const DEFAULT_HERO: HomeHeroVM = {
  eyebrow: "Artifex Furniture",
  heading: "Crafted furniture for modern homes",
  subheading: "Solid materials, honest craft, and comfort that lasts.",
  slides: [],
  cta: { label: "Explore the collection", href: "/products" },
  secondary: { label: "Visit the showroom", href: "/contact" },
};

async function loadHero(): Promise<HomeHeroVM> {
  "use cache";
  cacheTag("home");
  cacheLife("hours");
  const [row, slideRows] = await Promise.all([findHomeHero(), findHeroSlides()]);
  const slides = slideRows
    .slice(0, MAX_HERO_SLIDES)
    .map((s) => ({ path: s.imagePath, alt: s.imageAlt }));
  if (!row) return { ...DEFAULT_HERO, slides };
  return {
    eyebrow: row.eyebrow,
    heading: row.heading,
    subheading: row.subheading,
    slides,
    cta: { label: row.ctaLabel, href: safeHref(row.ctaHref) ?? "/products" },
    secondary:
      row.secondaryLabel && safeHref(row.secondaryHref)
        ? { label: row.secondaryLabel, href: safeHref(row.secondaryHref)! }
        : null,
  };
}

async function loadCategories(): Promise<HomeCategoryVM[]> {
  "use cache";
  cacheTag("categories", "home");
  cacheLife("hours");
  return (await findHomeCategories()).map((c) => ({ ...c, href: categoryHref(c.slug) }));
}

async function loadNewArrivals(): Promise<ProductCardVM[]> {
  "use cache";
  cacheTag("products", "home");
  cacheLife("hours");
  return (await findNewArrivals(RAIL_SIZE)).map(toCardVM);
}

async function loadBanners(): Promise<PromoBannerRow[]> {
  "use cache";
  cacheTag("home");
  cacheLife("hours");
  return findActiveBanners();
}

/** Run a home block; on failure log it and hide the section instead of failing the page. */
async function safely<T>(label: string, fallback: T, load: () => Promise<T>): Promise<T> {
  try {
    return await load();
  } catch (err) {
    console.error(`[home.${label}]`, err);
    return fallback;
  }
}

export async function getHomeHero(): Promise<HomeHeroVM> {
  await connection();
  return safely("hero", DEFAULT_HERO, loadHero);
}

export async function getHomeCategories(): Promise<HomeCategoryVM[]> {
  await connection();
  return safely("categories", [], loadCategories);
}

export async function getNewArrivals(): Promise<ProductCardVM[]> {
  await connection();
  return safely("newArrivals", [], loadNewArrivals);
}

/** Banners that are active and inside their date window right now (max 2, F6). */
export async function getPromoBanners(at?: Date): Promise<PromoBannerVM[]> {
  await connection();
  // Read the clock only after connection(): a default parameter would run during prerendering.
  const now = at ?? new Date();
  const rows = await safely("banners", [], loadBanners);
  return rows
    .filter((b) => (!b.startsAt || b.startsAt <= now) && (!b.endsAt || b.endsAt >= now))
    .slice(0, MAX_BANNERS)
    .map((b) => ({
      id: b.id,
      title: b.title,
      subtitle: b.subtitle,
      imagePath: b.imagePath,
      imageAlt: b.imageAlt,
      linkHref: safeHref(b.linkHref),
      linkLabel: b.linkLabel,
    }));
}
