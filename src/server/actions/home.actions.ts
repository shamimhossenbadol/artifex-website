"use server";
// Homepage editor (07 §3.5): requireAdmin → Zod → service → revalidate "home" (07 §5).
import { updateTag } from "next/cache";
import { invalid, type ActionResult } from "@/lib/action-result";
import { bannerSchema, heroSchema, idSchema } from "@/lib/validation/home";
import { requireAdmin } from "@/server/services/auth.service";
import {
  createBanner,
  deleteBanner,
  moveBanner,
  saveHero,
  updateBanner,
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
  const result = await saveHero(parsed.data, pickFile(formData.get("image")));
  if (!result.ok) return fail(result);
  updateTag("home");
  return { ok: true, message: "Hero saved. The homepage is updated." };
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
