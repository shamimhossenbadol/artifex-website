// Settings editor (07 §3.6). Kept apart from settings.service so public pages never load sharp.
import { connection } from "next/server";
import { parseOpeningHours, type SettingsForm } from "@/lib/validation/settings";
import {
  findSiteSettings,
  saveSiteSettings,
  type SiteSettingsData,
} from "@/server/repositories/settings.repo";
import { discardImage, storeImage } from "./media.service";
import { FALLBACK_SETTINGS, type SiteSettings } from "./settings.service";

/** Uncached read for the editor: always the latest saved values. */
export async function getSettingsForEdit(): Promise<SiteSettings> {
  await connection();
  const row = await findSiteSettings();
  return row ? { ...row, openingHours: parseOpeningHours(row.openingHours) } : FALLBACK_SETTINGS;
}

/** The form's fields minus the "section" discriminator. */
function withoutSection<T extends { section: string }>(form: T): Omit<T, "section"> {
  const fields: Partial<T> = { ...form };
  delete fields.section;
  return fields as Omit<T, "section">;
}

export type SaveSettingsResult = { ok: true } | { ok: false; error: string; field?: string };

/** Saves one settings tab. The SEO tab may also replace or remove the default share image. */
export async function saveSettings(
  form: SettingsForm,
  ogImageFile: File | null = null,
): Promise<SaveSettingsResult> {
  let patch: Partial<SiteSettingsData>;
  let oldOgImage: string | null = null;

  if (form.section === "seo") {
    const { defaultSeoTitle, defaultSeoDescription, removeOgImage } = form;
    patch = { defaultSeoTitle, defaultSeoDescription };
    if (ogImageFile || removeOgImage) {
      oldOgImage = (await findSiteSettings())?.ogImagePath ?? null;
      patch.ogImagePath = null;
    }
    if (ogImageFile) {
      const upload = await storeImage(ogImageFile, "site");
      if (!upload.ok) return { ok: false, error: upload.error, field: "ogImage" };
      patch.ogImagePath = upload.image.path;
    }
  } else {
    patch = withoutSection(form);
  }

  try {
    await saveSiteSettings(patch, FALLBACK_SETTINGS);
  } catch (err) {
    // The new image isn't referenced anywhere yet: remove it again.
    if (patch.ogImagePath) await discardImage(patch.ogImagePath);
    throw err;
  }
  if (oldOgImage && oldOgImage !== patch.ogImagePath) await discardImage(oldOgImage);
  return { ok: true };
}
