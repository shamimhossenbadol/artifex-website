"use server";
// Products (07 §3.2): requireAdmin → Zod → service → revalidate (07 §5).
import { updateTag } from "next/cache";
import { invalid, type ActionResult } from "@/lib/action-result";
import { idSchema } from "@/lib/validation/home";
import { imageAltSchema, productSchema } from "@/lib/validation/product";
import { requireAdmin } from "@/server/services/auth.service";
import type { SaveResult } from "@/server/services/home-admin.service";
import { pickFile } from "@/server/services/media.service";
import {
  addProductImage,
  createProduct,
  deleteImage,
  deleteProduct,
  duplicateProduct,
  moveImage,
  setImageAlt,
  setPrimaryImage,
  updateProduct,
  type AdminProductImage,
} from "@/server/services/product-admin.service";

function fail(result: Extract<SaveResult<unknown>, { ok: false }>): ActionResult<never> {
  return {
    ok: false,
    error: result.error,
    fieldErrors: result.field ? { [result.field]: [result.error] } : undefined,
  };
}

/** Product create/update/delete: listings, the product page(s), home rails and category counts. */
function revalidateProduct(...slugs: string[]): void {
  updateTag("products");
  updateTag("home");
  updateTag("categories");
  for (const slug of new Set(slugs)) updateTag(`product:${slug}`);
}

/** Image changes (07 §5): the product page, cards and home rails. */
function revalidateImages(slug: string): void {
  updateTag(`product:${slug}`);
  updateTag("products");
  updateTag("home");
}

function fieldsOf(formData: FormData): Record<string, FormDataEntryValue> {
  const fields = Object.fromEntries(formData);
  delete fields.id;
  return fields;
}

export async function createProductAction(
  _prev: ActionResult<{ id: number }> | null,
  formData: FormData,
): Promise<ActionResult<{ id: number }>> {
  await requireAdmin();
  const parsed = productSchema.safeParse(fieldsOf(formData));
  if (!parsed.success) return invalid(parsed.error);
  const result = await createProduct(parsed.data);
  if (!result.ok) return fail(result);
  revalidateProduct(result.data.slug);
  return {
    ok: true,
    data: { id: result.data.id },
    message: "Product created. Now add its photos.",
  };
}

export async function updateProductAction(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  await requireAdmin();
  const id = idSchema.safeParse(formData.get("id"));
  if (!id.success) return { ok: false, error: "Unknown product." };
  const parsed = productSchema.safeParse(fieldsOf(formData));
  if (!parsed.success) return invalid(parsed.error);
  const result = await updateProduct(id.data, parsed.data);
  if (!result.ok) return fail(result);
  revalidateProduct(result.data.oldSlug, result.data.newSlug);
  return { ok: true, message: "Product saved." };
}

export async function duplicateProductAction(id: number): Promise<ActionResult<{ id: number }>> {
  await requireAdmin();
  const parsed = idSchema.safeParse(id);
  if (!parsed.success) return { ok: false, error: "Unknown product." };
  const result = await duplicateProduct(parsed.data);
  if (!result.ok) return fail(result);
  // A draft copy isn't public; only the admin counts change.
  return { ok: true, data: result.data, message: "Copy created as a draft." };
}

export async function deleteProductAction(id: number): Promise<ActionResult> {
  await requireAdmin();
  const parsed = idSchema.safeParse(id);
  if (!parsed.success) return { ok: false, error: "Unknown product." };
  const result = await deleteProduct(parsed.data);
  if (!result.ok) return fail(result);
  if (result.data) revalidateProduct(result.data.slug);
  return { ok: true, message: "Product deleted." };
}

// --- Images (one file per request, 07 §4) ------------------------------------------------------

export async function uploadProductImageAction(
  formData: FormData,
): Promise<ActionResult<AdminProductImage>> {
  await requireAdmin();
  const productId = idSchema.safeParse(formData.get("productId"));
  if (!productId.success) return { ok: false, error: "Unknown product." };
  const file = pickFile(formData.get("file"));
  if (!file) return { ok: false, error: "Choose a photo." };
  const result = await addProductImage(productId.data, file);
  if (!result.ok) return fail(result);
  revalidateImages(result.data.slug);
  return { ok: true, data: result.data.image };
}

async function imageAction(
  imageId: number,
  run: (id: number) => Promise<SaveResult<{ slug: string }>>,
  message?: string,
): Promise<ActionResult> {
  await requireAdmin();
  const parsed = idSchema.safeParse(imageId);
  if (!parsed.success) return { ok: false, error: "Unknown photo." };
  const result = await run(parsed.data);
  if (!result.ok) return fail(result);
  revalidateImages(result.data.slug);
  return { ok: true, message };
}

export async function updateImageAltAction(imageId: number, alt: string): Promise<ActionResult> {
  const parsed = imageAltSchema.safeParse(alt);
  if (!parsed.success) {
    await requireAdmin();
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Describe the photo." };
  }
  return imageAction(imageId, (id) => setImageAlt(id, parsed.data), "Description saved.");
}

export async function setPrimaryImageAction(imageId: number): Promise<ActionResult> {
  return imageAction(imageId, setPrimaryImage, "Featured photo set.");
}

export async function moveImageAction(
  imageId: number,
  direction: "up" | "down",
): Promise<ActionResult> {
  if (direction !== "up" && direction !== "down") {
    await requireAdmin();
    return { ok: false, error: "Unknown direction." };
  }
  return imageAction(imageId, (id) => moveImage(id, direction));
}

export async function deleteImageAction(imageId: number): Promise<ActionResult> {
  return imageAction(imageId, deleteImage, "Photo deleted.");
}
