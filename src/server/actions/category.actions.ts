"use server";
// Categories (07 §3.3): requireAdmin → Zod → service → revalidate (07 §5: categories, products, home).
import { updateTag } from "next/cache";
import { invalid, type ActionResult } from "@/lib/action-result";
import { categoryFlagSchema, categorySchema } from "@/lib/validation/category";
import { idSchema } from "@/lib/validation/home";
import { requireAdmin } from "@/server/services/auth.service";
import {
  createCategory,
  deleteCategory,
  moveCategory,
  toggleCategoryFlag,
  updateCategory,
} from "@/server/services/category-admin.service";
import type { SaveResult } from "@/server/services/home-admin.service";
import { pickFile } from "@/server/services/media.service";

function fail(result: Extract<SaveResult<unknown>, { ok: false }>): ActionResult<never> {
  return {
    ok: false,
    error: result.error,
    fieldErrors: result.field ? { [result.field]: [result.error] } : undefined,
  };
}

/** Category changes show in the nav, category pages, product pages, search and the homepage. */
function revalidateCategories(...slugs: string[]): void {
  updateTag("categories");
  updateTag("products");
  updateTag("home");
  for (const slug of new Set(slugs)) updateTag(`category:${slug}`);
}

/** Text fields only; the file input is read separately. */
function fieldsOf(formData: FormData): Record<string, FormDataEntryValue> {
  const fields = Object.fromEntries(formData);
  delete fields.image;
  delete fields.id;
  return fields;
}

export async function createCategoryAction(
  _prev: ActionResult<{ id: number }> | null,
  formData: FormData,
): Promise<ActionResult<{ id: number }>> {
  await requireAdmin();
  const parsed = categorySchema.safeParse(fieldsOf(formData));
  if (!parsed.success) return invalid(parsed.error);
  const result = await createCategory(parsed.data, pickFile(formData.get("image")));
  if (!result.ok) return fail(result);
  revalidateCategories(parsed.data.slug);
  return { ok: true, data: result.data, message: "Category created." };
}

export async function updateCategoryAction(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  await requireAdmin();
  const id = idSchema.safeParse(formData.get("id"));
  if (!id.success) return { ok: false, error: "Unknown category." };
  const parsed = categorySchema.safeParse(fieldsOf(formData));
  if (!parsed.success) return invalid(parsed.error);
  const result = await updateCategory(id.data, parsed.data, pickFile(formData.get("image")));
  if (!result.ok) return fail(result);
  revalidateCategories(result.data.oldSlug, result.data.newSlug);
  return { ok: true, message: "Category saved." };
}

export async function toggleCategoryFlagAction(
  id: number,
  flag: string,
  value: boolean,
): Promise<ActionResult> {
  await requireAdmin();
  const parsedId = idSchema.safeParse(id);
  const parsedFlag = categoryFlagSchema.safeParse(flag);
  if (!parsedId.success || !parsedFlag.success || typeof value !== "boolean") {
    return { ok: false, error: "Unknown category." };
  }
  const result = await toggleCategoryFlag(parsedId.data, parsedFlag.data, value);
  if (!result.ok) return fail(result);
  revalidateCategories(result.data.slug);
  return { ok: true };
}

export async function deleteCategoryAction(id: number): Promise<ActionResult> {
  await requireAdmin();
  const parsed = idSchema.safeParse(id);
  if (!parsed.success) return { ok: false, error: "Unknown category." };
  const result = await deleteCategory(parsed.data);
  if (!result.ok) return fail(result);
  if (result.data) revalidateCategories(result.data.slug);
  return { ok: true, message: "Category deleted." };
}

export async function moveCategoryAction(
  id: number,
  direction: "up" | "down",
): Promise<ActionResult> {
  await requireAdmin();
  const parsed = idSchema.safeParse(id);
  if (!parsed.success || (direction !== "up" && direction !== "down")) {
    return { ok: false, error: "Unknown category." };
  }
  await moveCategory(parsed.data, direction);
  revalidateCategories();
  return { ok: true };
}
