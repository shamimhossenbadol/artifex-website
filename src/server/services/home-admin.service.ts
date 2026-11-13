// Homepage editor (07 §3.5): hero text, hero slides (ADR-039) and promo banners. Images go to R2
// under "home/". Order for image changes: upload the new one → save the row → delete the old one,
// so a failure never leaves a row pointing at a missing image.
import { connection } from "next/server";
import type { BannerInput, HeroInput } from "@/lib/validation/home";
import {
  countHeroSlides,
  createBanner as insertBanner,
  deleteBanner as removeBanner,
  deleteHeroSlide,
  findAllBanners,
  findBannerById,
  findHeroSlide,
  findHeroSlides,
  findHomeHero,
  insertHeroSlide,
  reorderBanners,
  reorderHeroSlides,
  saveHomeHero,
  updateBanner as writeBanner,
  updateHeroSlideAlt,
  type AdminBannerRow,
  type BannerData,
  type HeroData,
} from "@/server/repositories/home.repo";
import { MAX_HERO_SLIDES } from "./home.service";
import { discardImage, storeImage } from "./media.service";

export type { AdminBannerRow };

export type HeroForEdit = HeroData;

/** Same shape as product photos, so the admin can reuse the photo manager. */
export type AdminHeroSlide = { id: number; path: string; alt: string };

const DEFAULT_HERO_DATA: HeroData = {
  eyebrow: "Artifex Furniture",
  heading: "Crafted furniture for modern homes",
  subheading: "Solid materials, honest craft, and comfort that lasts.",
  ctaLabel: "Explore the collection",
  ctaHref: "/products",
  secondaryLabel: "Visit the showroom",
  secondaryHref: "/contact",
};

/** Used when a slide is uploaded; the admin can refine it, and alt text is never empty. */
export const DEFAULT_SLIDE_ALT = "Furniture by Artifex Furniture";

export async function getHeroForEdit(): Promise<HeroForEdit> {
  await connection();
  return (await findHomeHero()) ?? DEFAULT_HERO_DATA;
}

export type SaveResult<T = void> =
  { ok: true; data: T } | { ok: false; error: string; field?: string };

export async function saveHero(input: HeroInput): Promise<SaveResult> {
  await saveHomeHero(input);
  return { ok: true, data: undefined };
}

// --- Hero slides (ADR-039) ---------------------------------------------------------------------

export async function listHeroSlides(): Promise<AdminHeroSlide[]> {
  await connection();
  return (await findHeroSlides()).map((s) => ({ id: s.id, path: s.imagePath, alt: s.imageAlt }));
}

export async function addHeroSlide(file: File): Promise<SaveResult<AdminHeroSlide>> {
  if ((await countHeroSlides()) >= MAX_HERO_SLIDES) {
    return { ok: false, error: `The hero can have up to ${MAX_HERO_SLIDES} photos.` };
  }
  const upload = await storeImage(file, "home");
  if (!upload.ok) return { ok: false, error: upload.error };
  try {
    const row = await insertHeroSlide({
      imagePath: upload.image.path,
      imageAlt: DEFAULT_SLIDE_ALT,
    });
    return { ok: true, data: { id: row.id, path: row.imagePath, alt: row.imageAlt } };
  } catch (err) {
    await discardImage(upload.image.path);
    throw err;
  }
}

const SLIDE_GONE: SaveResult = { ok: false, error: "This photo no longer exists." };

export async function setHeroSlideAlt(id: number, alt: string): Promise<SaveResult> {
  if (!(await findHeroSlide(id))) return SLIDE_GONE;
  await updateHeroSlideAlt(id, alt);
  return { ok: true, data: undefined };
}

export async function moveHeroSlide(id: number, direction: "up" | "down"): Promise<SaveResult> {
  const ids = (await findHeroSlides()).map((s) => s.id);
  const index = ids.indexOf(id);
  if (index === -1) return SLIDE_GONE;
  const target = direction === "up" ? index - 1 : index + 1;
  if (target >= 0 && target < ids.length) {
    [ids[index], ids[target]] = [ids[target]!, ids[index]!];
    await reorderHeroSlides(ids);
  }
  return { ok: true, data: undefined };
}

export async function removeHeroSlide(id: number): Promise<SaveResult> {
  const slide = await findHeroSlide(id);
  if (!slide) return { ok: true, data: undefined };
  await deleteHeroSlide(id);
  await discardImage(slide.imagePath);
  return { ok: true, data: undefined };
}

// --- Promo banners -----------------------------------------------------------------------------

export type BannerState = "live" | "scheduled" | "ended" | "hidden";

export type AdminBannerVM = AdminBannerRow & { state: BannerState };

export function bannerState(
  banner: Pick<AdminBannerRow, "isActive" | "startsAt" | "endsAt">,
  now: Date,
): BannerState {
  if (!banner.isActive) return "hidden";
  if (banner.startsAt && banner.startsAt > now) return "scheduled";
  if (banner.endsAt && banner.endsAt < now) return "ended";
  return "live";
}

export async function listBanners(): Promise<AdminBannerVM[]> {
  await connection();
  const now = new Date();
  return (await findAllBanners()).map((b) => ({ ...b, state: bannerState(b, now) }));
}

export async function getBanner(id: number): Promise<AdminBannerRow | null> {
  await connection();
  return findBannerById(id);
}

function toBannerData(input: BannerInput, imagePath: string): BannerData {
  return { ...input, imagePath };
}

export async function createBanner(
  input: BannerInput,
  file: File | null,
): Promise<SaveResult<{ id: number }>> {
  if (!file) return { ok: false, error: "Choose an image for the banner.", field: "image" };
  const upload = await storeImage(file, "home");
  if (!upload.ok) return { ok: false, error: upload.error, field: "image" };
  try {
    return { ok: true, data: { id: await insertBanner(toBannerData(input, upload.image.path)) } };
  } catch (err) {
    await discardImage(upload.image.path);
    throw err;
  }
}

export async function updateBanner(
  id: number,
  input: BannerInput,
  file: File | null,
): Promise<SaveResult> {
  const current = await findBannerById(id);
  if (!current) return { ok: false, error: "This banner no longer exists." };

  let imagePath = current.imagePath;
  if (file) {
    const upload = await storeImage(file, "home");
    if (!upload.ok) return { ok: false, error: upload.error, field: "image" };
    imagePath = upload.image.path;
  }
  try {
    await writeBanner(id, toBannerData(input, imagePath));
  } catch (err) {
    if (file) await discardImage(imagePath);
    throw err;
  }
  if (file) await discardImage(current.imagePath);
  return { ok: true, data: undefined };
}

export async function deleteBanner(id: number): Promise<SaveResult> {
  const current = await findBannerById(id);
  if (!current) return { ok: true, data: undefined };
  await removeBanner(id);
  await discardImage(current.imagePath);
  return { ok: true, data: undefined };
}

/** Moves a banner one place up or down. */
export async function moveBanner(id: number, direction: "up" | "down"): Promise<SaveResult> {
  const ids = (await findAllBanners()).map((b) => b.id);
  const index = ids.indexOf(id);
  const target = direction === "up" ? index - 1 : index + 1;
  if (index === -1 || target < 0 || target >= ids.length) return { ok: true, data: undefined };
  [ids[index], ids[target]] = [ids[target]!, ids[index]!];
  await reorderBanners(ids);
  return { ok: true, data: undefined };
}
