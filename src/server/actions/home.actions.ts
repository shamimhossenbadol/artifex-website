"use server";
// Homepage editor (07 §3.5): requireAdmin → Zod → service → revalidate "home" (07 §5).
import { updateTag } from "next/cache";
import { invalid, type ActionResult } from "@/lib/action-result";
import { bannerSchema, heroSchema, idSchema, slideAltSchema } from "@/lib/validation/home";
import { requireAdmin } from "@/server/services/auth.service";
import {
  addHeroSlide,
  createBanner,
  deleteBanner,
  moveBanner,
  moveHeroSlide,
  removeHeroSlide,
  saveHero,
  setHeroSlideAlt,
  updateBanner,
  type AdminHeroSlide,
  type SaveResult,
} from "@/server/services/home-admin.service";
import { pickFile } from "@/server/services/media.service";

function fail(result: Extract<SaveResult<unknown>, { ok: false }>): ActionResult<never> {
  return {
    ok: false,
    error: result.error,
    fieldErrors: result.field ? { [result.field]: [result.error] } : undefined,
  };
}

/** Text fields only; the file input is read separately. */
function fieldsOf(formData: FormData): Record<string, FormDataEntryValue> {
  const fields = Object.fromEntries(formData);
  delete fields.image;
  return fields;
}

export async function saveHeroAction(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  await requireAdmin();
  const parsed = heroSchema.safeParse(fieldsOf(formData));
  if (!parsed.success) return invalid(parsed.error);
  const result = await saveHero(parsed.data);
  if (!result.ok) return fail(result);
  updateTag("home");
  return { ok: true, message: "Hero saved. The homepage is updated." };
}

// --- Hero slides (ADR-039): one file per request, like product photos (07 §4) -----------------

export async function uploadHeroSlideAction(
  formData: FormData,
): Promise<ActionResult<AdminHeroSlide>> {
  await requireAdmin();
  const file = pickFile(formData.get("file"));
  if (!file) return { ok: false, error: "Choose a photo." };
  const result = await addHeroSlide(file);
  if (!result.ok) return fail(result);
  updateTag("home");
  return { ok: true, data: result.data };
}

async function slideAction(
  id: number,
  run: (id: number) => Promise<SaveResult>,
  message?: string,
): Promise<ActionResult> {
  await requireAdmin();
  const parsed = idSchema.safeParse(id);
  if (!parsed.success) return { ok: false, error: "Unknown photo." };
  const result = await run(parsed.data);
  if (!result.ok) return fail(result);
  updateTag("home");
  return { ok: true, message };
}

export async function updateHeroSlideAltAction(id: number, alt: string): Promise<ActionResult> {
  const parsed = slideAltSchema.safeParse(alt);
  if (!parsed.success) {
    await requireAdmin();
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Describe the photo." };
  }
  return slideAction(id, (slideId) => setHeroSlideAlt(slideId, parsed.data), "Description saved.");
}

export async function moveHeroSlideAction(
  id: number,
  direction: "up" | "down",
): Promise<ActionResult> {
  if (direction !== "up" && direction !== "down") {
    await requireAdmin();
    return { ok: false, error: "Unknown direction." };
  }
  return slideAction(id, (slideId) => moveHeroSlide(slideId, direction));
}

export async function deleteHeroSlideAction(id: number): Promise<ActionResult> {
  return slideAction(id, removeHeroSlide, "Photo deleted.");
}

export async function createBannerAction(
  _prev: ActionResult<{ id: number }> | null,
  formData: FormData,
): Promise<ActionResult<{ id: number }>> {
  await requireAdmin();
  const parsed = bannerSchema.safeParse(fieldsOf(formData));
  if (!parsed.success) return invalid(parsed.error);
  const result = await createBanner(parsed.data, pickFile(formData.get("image")));
  if (!result.ok) return fail(result);
  updateTag("home");
  return { ok: true, data: result.data, message: "Banner created." };
}

export async function updateBannerAction(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  await requireAdmin();
  const id = idSchema.safeParse(formData.get("id"));
  if (!id.success) return { ok: false, error: "Unknown banner." };
  const fields = fieldsOf(formData);
  delete fields.id;
  const parsed = bannerSchema.safeParse(fields);
  if (!parsed.success) return invalid(parsed.error);
  const result = await updateBanner(id.data, parsed.data, pickFile(formData.get("image")));
  if (!result.ok) return fail(result);
  updateTag("home");
  return { ok: true, message: "Banner saved." };
}

export async function deleteBannerAction(id: number): Promise<ActionResult> {
  await requireAdmin();
  const parsed = idSchema.safeParse(id);
  if (!parsed.success) return { ok: false, error: "Unknown banner." };
  await deleteBanner(parsed.data);
  updateTag("home");
  return { ok: true, message: "Banner deleted." };
}

export async function moveBannerAction(
  id: number,
  direction: "up" | "down",
): Promise<ActionResult> {
  await requireAdmin();
  const parsed = idSchema.safeParse(id);
  if (!parsed.success || (direction !== "up" && direction !== "down")) {
    return { ok: false, error: "Unknown banner." };
  }
  await moveBanner(parsed.data, direction);
  updateTag("home");
  return { ok: true };
}
