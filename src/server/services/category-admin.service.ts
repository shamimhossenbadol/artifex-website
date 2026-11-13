// Category admin (07 §3.3): list, create/edit with an image, flags, order, guarded delete.
// Image changes follow ADR-031: upload the new one → save the row → delete the old one.
import { connection } from "next/server";
import { buildSearchText } from "@/lib/search-text";
import type { CategoryFlag, CategoryInput } from "@/lib/validation/category";
import {
  countProductsInCategory,
  createCategory as insertCategory,
  deleteCategory as removeCategory,
  findAllCategoriesForAdmin,
  findCategoryById,
  findCategoryIdBySlug,
  findProductSearchSources,
  reorderCategories,
  setCategoryFlag,
  updateCategory as writeCategory,
  updateProductSearchTexts,
  type AdminCategoryRow,
  type CategoryData,
} from "@/server/repositories/category.repo";
import type { SaveResult } from "./home-admin.service";
import { discardImage, storeImage } from "./media.service";

export type AdminCategoryVM = Omit<AdminCategoryRow, "_count"> & { productCount: number };

function toVM({ _count, ...row }: AdminCategoryRow): AdminCategoryVM {
  return { ...row, productCount: _count.products };
}

export async function listCategories(): Promise<AdminCategoryVM[]> {
  await connection();
  return (await findAllCategoriesForAdmin()).map(toVM);
}

export async function getCategory(id: number): Promise<AdminCategoryVM | null> {
  await connection();
  const row = await findCategoryById(id);
  return row ? toVM(row) : null;
}

const SLUG_TAKEN = "Another category already uses this web address.";

function isUniqueViolation(err: unknown): boolean {
  return typeof err === "object" && err !== null && "code" in err && err.code === "P2002";
}

function toData(input: CategoryInput, imagePath: string | null): CategoryData {
  return {
    name: input.name,
    slug: input.slug,
    description: input.description,
    imagePath,
    isActive: input.isActive,
    showOnHome: input.showOnHome,
    seoTitle: input.seoTitle,
    seoDescription: input.seoDescription,
  };
}

/** Product search text includes the category name (04 §4), so a rename recomputes it. */
async function refreshProductSearchText(categoryId: number, categoryName: string): Promise<void> {
  const products = await findProductSearchSources(categoryId);
  await updateProductSearchTexts(
    products.map((p) => ({
      id: p.id,
      searchText: buildSearchText({
        title: p.title,
        categoryName,
        keywords: p.keywords,
        material: p.material,
        colorNames: p.colors.map((c) => c.name),
      }),
    })),
  );
}

export async function createCategory(
  input: CategoryInput,
  file: File | null,
): Promise<SaveResult<{ id: number }>> {
  if ((await findCategoryIdBySlug(input.slug)) !== null) {
    return { ok: false, error: SLUG_TAKEN, field: "slug" };
  }
  let imagePath: string | null = null;
  if (file) {
    const upload = await storeImage(file, "categories");
    if (!upload.ok) return { ok: false, error: upload.error, field: "image" };
    imagePath = upload.image.path;
  }
  try {
    return { ok: true, data: { id: await insertCategory(toData(input, imagePath)) } };
  } catch (err) {
    await discardImage(imagePath);
    if (isUniqueViolation(err)) return { ok: false, error: SLUG_TAKEN, field: "slug" };
    throw err;
  }
}

export type UpdatedCategory = { oldSlug: string; newSlug: string };

export async function updateCategory(
  id: number,
  input: CategoryInput,
  file: File | null,
): Promise<SaveResult<UpdatedCategory>> {
  const current = await findCategoryById(id);
  if (!current) return { ok: false, error: "This category no longer exists." };
  const owner = await findCategoryIdBySlug(input.slug);
  if (owner !== null && owner !== id) return { ok: false, error: SLUG_TAKEN, field: "slug" };

  let imagePath = input.removeImage ? null : current.imagePath;
  if (file) {
    const upload = await storeImage(file, "categories");
    if (!upload.ok) return { ok: false, error: upload.error, field: "image" };
    imagePath = upload.image.path;
  }
  try {
    await writeCategory(id, toData(input, imagePath));
  } catch (err) {
    if (file) await discardImage(imagePath);
    if (isUniqueViolation(err)) return { ok: false, error: SLUG_TAKEN, field: "slug" };
    throw err;
  }
  if (imagePath !== current.imagePath) await discardImage(current.imagePath);
  if (input.name !== current.name) await refreshProductSearchText(id, input.name);
  return { ok: true, data: { oldSlug: current.slug, newSlug: input.slug } };
}

export async function toggleCategoryFlag(
  id: number,
  flag: CategoryFlag,
  value: boolean,
): Promise<SaveResult<{ slug: string }>> {
  const current = await findCategoryById(id);
  if (!current) return { ok: false, error: "This category no longer exists." };
  await setCategoryFlag(id, flag, value);
  return { ok: true, data: { slug: current.slug } };
}

/** Blocked while products use the category (04 §5: onDelete Restrict). */
export async function deleteCategory(id: number): Promise<SaveResult<{ slug: string } | null>> {
  const current = await findCategoryById(id);
  if (!current) return { ok: true, data: null };
  const products = await countProductsInCategory(id);
  if (products > 0) {
    return {
      ok: false,
      error: `“${current.name}” still has ${products} product${products === 1 ? "" : "s"}. Move or delete them first.`,
    };
  }
  await removeCategory(id);
  await discardImage(current.imagePath);
  return { ok: true, data: { slug: current.slug } };
}

/** Moves a category one place up or down. */
export async function moveCategory(id: number, direction: "up" | "down"): Promise<SaveResult> {
  const ids = (await findAllCategoriesForAdmin()).map((c) => c.id);
  const index = ids.indexOf(id);
  const target = direction === "up" ? index - 1 : index + 1;
  if (index === -1 || target < 0 || target >= ids.length) return { ok: true, data: undefined };
  [ids[index], ids[target]] = [ids[target]!, ids[index]!];
  await reorderCategories(ids);
  return { ok: true, data: undefined };
}
