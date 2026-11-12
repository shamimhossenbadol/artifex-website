// Site settings for the header, footer, WhatsApp links and contact info. Cached under tag "settings".
import { cacheLife, cacheTag } from "next/cache";
import { connection } from "next/server";
import { SITE_NAME, SITE_TAGLINE } from "@/config/site";
import { parseOpeningHours, type OpeningHoursEntry } from "@/lib/validation/settings";
import { findSiteSettings, type SiteSettingsRow } from "@/server/repositories/settings.repo";

export type SiteSettings = Omit<SiteSettingsRow, "openingHours"> & {
  openingHours: OpeningHoursEntry[];
};

/** Used only if the settings row is missing or the database is unreachable (logged). */
export const FALLBACK_SETTINGS: SiteSettings = {
  businessName: SITE_NAME,
  tagline: SITE_TAGLINE,
  phone: "",
  whatsappNumber: "",
  whatsappDefaultMessage: `Hello ${SITE_NAME}, I'd like to know more about your furniture.`,
  whatsappProductTemplate: "Hello {business}, I'm interested in {product}{color}. {url}",
  email: null,
  addressLine: "",
  city: "Dhaka",
  mapLinkUrl: null,
  openingHours: [],
  facebookUrl: null,
  instagramUrl: null,
  youtubeUrl: null,
  aboutShort: null,
  defaultSeoTitle: SITE_NAME,
  defaultSeoDescription: SITE_TAGLINE,
};

async function loadSiteSettings(): Promise<SiteSettings | null> {
  "use cache";
  cacheTag("settings");
  cacheLife("hours"); // on-demand revalidation via the tag; 1 h fallback (08 §5)
  const row = await findSiteSettings();
  return row ? { ...row, openingHours: parseOpeningHours(row.openingHours) } : null;
}

/**
 * Request-time read (ADR-020): `connection()` keeps the query out of `next build`, and
 * "use cache" keeps the result in memory until an admin edit revalidates the tag.
 */
export async function getSiteSettings(): Promise<SiteSettings> {
  await connection();
  try {
    return (await loadSiteSettings()) ?? FALLBACK_SETTINGS;
  } catch (err) {
    console.error("[settings.getSiteSettings]", err);
    return FALLBACK_SETTINGS;
  }
}
