// Site settings singleton (id = 1) queries. The only place that reads SiteSetting via Prisma.
import type { Prisma } from "@/generated/prisma/client";
import { db } from "@/lib/db";

export const SITE_SETTINGS_SELECT = {
  businessName: true,
  tagline: true,
  phone: true,
  whatsappNumber: true,
  whatsappDefaultMessage: true,
  whatsappProductTemplate: true,
  email: true,
  addressLine: true,
  city: true,
  mapLinkUrl: true,
  openingHours: true,
  facebookUrl: true,
  instagramUrl: true,
  youtubeUrl: true,
  aboutShort: true,
  aboutContent: true,
  mapEmbedUrl: true,
  latitude: true,
  longitude: true,
  ogImagePath: true,
  facebookPixelId: true,
  defaultSeoTitle: true,
  defaultSeoDescription: true,
} as const;

export async function findSiteSettings() {
  return db.siteSetting.findUnique({ where: { id: 1 }, select: SITE_SETTINGS_SELECT });
}

export type SiteSettingsRow = NonNullable<Awaited<ReturnType<typeof findSiteSettings>>>;

export type SiteSettingsData = Omit<SiteSettingsRow, "openingHours"> & {
  openingHours: Prisma.InputJsonValue;
};

/** Saves part of the singleton; creates it from `defaults` if the seed never ran. */
export async function saveSiteSettings(
  patch: Partial<SiteSettingsData>,
  defaults: SiteSettingsData,
): Promise<void> {
  await db.siteSetting.upsert({
    where: { id: 1 },
    update: patch,
    create: { ...defaults, ...patch, id: 1 },
  });
}
