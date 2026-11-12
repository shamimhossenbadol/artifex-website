// Site settings singleton (id = 1) queries. The only place that reads SiteSetting via Prisma.
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
  defaultSeoTitle: true,
  defaultSeoDescription: true,
} as const;

export async function findSiteSettings() {
  return db.siteSetting.findUnique({ where: { id: 1 }, select: SITE_SETTINGS_SELECT });
}

export type SiteSettingsRow = NonNullable<Awaited<ReturnType<typeof findSiteSettings>>>;
