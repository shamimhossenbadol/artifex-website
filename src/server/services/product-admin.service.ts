// Product admin (07 §3.2): list, create/edit (with colours and specs), duplicate, delete, and
// per-image actions. Images are uploaded one per request (07 §4) after the product exists.
import { connection } from "next/server";
import { escapeLike } from "@/lib/search";
import { buildSearchText, effectivePrice } from "@/lib/search-text";
import {
  ADMIN_PRODUCTS_PER_PAGE,
  MAX_PRODUCT_IMAGES,
  PRODUCT_SLUG_MAX,
  type AdminProductQuery,
  type ProductInput,
} from "@/lib/validation/product";
import {
  countProductImages,
  findAdminProducts,
  findCategoryName,
  findCategoryOptions,
  findImageIds,
  findProductForEdit,
  findProductIdBySku,
  findProductIdBySlug,
  findProductImage,
  insertProduct,
  insertProductImage,
  makeImagePrimary,
  removeProduct,
  removeProductImage,
  reorderImages,
  touchProduct,
  updateImageAlt,
  writeProduct,
  type AdminProductListRow,
  type AdminProductRow,
  type CategoryOption,
  type ProductData,
} from "@/server/repositories/product-admin.repo";
import type { SaveResult } from "./home-admin.service";
import { discardImage, storeImage } from "./media.service";

export type { AdminProductRow, CategoryOption };

export type AdminProductListItem = Omit<AdminProductListRow, "images" | "_count"> & {
  imagePath: string | null;
  imageCount: number;
};

export type AdminProductList = {
  items: AdminProductListItem[];
  total: number;
  page: number;
  pageCount: number;
};

export async function listAdminProducts(query: AdminProductQuery): Promise<AdminProductList> {
  await connection();
  const { total, rows } = await findAdminProducts({
    titleContains: query.q ? escapeLike(query.q) : undefined,
    categorySlug: query.category,
    status: query.status,
    flag: query.flag,
    sort: query.sort ?? "updated",
    skip: (query.page - 1) * ADMIN_PRODUCTS_PER_PAGE,
    take: ADMIN_PRODUCTS_PER_PAGE,
  });
  return {
    items: rows.map(({ images, _count, ...row }) => ({
      ...row,
      imagePath: images[0]?.path ?? null,
      imageCount: _count.images,
    })),
    total,
    page: query.page,
    pageCount: Math.max(1, Math.ceil(total / ADMIN_PRODUCTS_PER_PAGE)),
  };
}

export async function getCategoryOptions(): Promise<CategoryOption[]> {
  await connection();
  return findCategoryOptions();
}

export async function getProductForEdit(id: number): Promise<AdminProductRow | null> {
  await connection();
  return findProductForEdit(id);
}

const SLUG_TAKEN = "Another product already uses this web address.";
const SKU_TAKEN = "Another product already uses this SKU.";

function uniqueField(err: unknown): "slug" | "sku" | null {
  if (typeof err !== "object" || err === null || !("code" in err) || err.code !== "P2002") {
    return null;
  }
  const target = JSON.stringify((err as { meta?: unknown }).meta ?? "");
  return target.includes("sku") ? "sku" : "slug";
}

function duplicateError(field: "slug" | "sku"): { ok: false; error: string; field: string } {
  return { ok: false, error: field === "sku" ? SKU_TAKEN : SLUG_TAKEN, field };
}

async function checkUnique(
  input: ProductInput,
  selfId: number | null,
): Promise<{ ok: false; error: string; field: string } | null> {
  const slugOwner = await findProductIdBySlug(input.slug);
  if (slugOwner !== null && slugOwner !== selfId) return duplicateError("slug");
  if (input.sku) {
    const skuOwner = await findProductIdBySku(input.sku);
    if (skuOwner !== null && skuOwner !== selfId) return duplicateError("sku");
  }
  return null;
}

function toData(
  input: ProductInput,
  categoryName: string,
  publishedAt: Date | null,
  now: Date,
): ProductData {
  return {
    title: input.title,
    slug: input.slug,
    categoryId: input.categoryId,
    shortDescription: input.shortDescription,
    description: input.description,
    regularPrice: input.regularPrice,
    discountPrice: input.discountPrice,
    effectivePrice: effectivePrice(input.regularPrice, input.discountPrice),
    sku: input.sku,
    material: input.material,
    dimensions: input.dimensions,
    isMadeToOrder: input.isMadeToOrder,
    isPopular: input.isPopular,
    isNewArrival: input.isNewArrival,
    status: input.status,
    // First publish stamps the date; it's kept if the product goes back to draft.
    publishedAt: input.status === "PUBLISHED" ? (publishedAt ?? now) : publishedAt,
    keywords: input.keywords,
    searchText: buildSearchText({
      title: input.title,
      categoryName,
      keywords: input.keywords,
      material: input.material,
      colorNames: input.colors.map((c) => c.name),
    }),
    seoTitle: input.seoTitle,
    seoDescription: input.seoDescription,
  };
}

export async function createProduct(
  input: ProductInput,
): Promise<SaveResult<{ id: number; slug: string }>> {
  const categoryName = await findCategoryName(input.categoryId);
  if (categoryName === null) {
    return { ok: false, error: "Choose a category.", field: "categoryId" };
  }
  const taken = await checkUnique(input, null);
  if (taken) return taken;
  try {
    const id = await insertProduct(toData(input, categoryName, null, new Date()), input);
    return { ok: true, data: { id, slug: input.slug } };
  } catch (err) {
    const field = uniqueField(err);
    if (field) return duplicateError(field);
    throw err;
  }
}

export type UpdatedProduct = { oldSlug: string; newSlug: string };

export async function updateProduct(
  id: number,
  input: ProductInput,
): Promise<SaveResult<UpdatedProduct>> {
  const current = await findProductForEdit(id);
  if (!current) return { ok: false, error: "This product no longer exists." };
  const categoryName = await findCategoryName(input.categoryId);
  if (categoryName === null) {
    return { ok: false, error: "Choose a category.", field: "categoryId" };
  }
  const taken = await checkUnique(input, id);
  if (taken) return taken;
  try {
    await writeProduct(id, toData(input, categoryName, current.publishedAt, new Date()), input);
  } catch (err) {
    const field = uniqueField(err);
    if (field) return duplicateError(field);
    throw err;
  }
  return { ok: true, data: { oldSlug: current.slug, newSlug: input.slug } };
}

/** "Duplicate" copies everything except slug, SKU and images, as a draft (07 §3.2). */
export async function duplicateProduct(id: number): Promise<SaveResult<{ id: number }>> {
  const source = await findProductForEdit(id);
  if (!source) return { ok: false, error: "This product no longer exists." };
  const categoryName = (await findCategoryName(source.categoryId)) ?? "";

  const base = `${source.slug.slice(0, PRODUCT_SLUG_MAX - 8)}-copy`;
  let slug = base;
  for (let n = 2; (await findProductIdBySlug(slug)) !== null; n++) {
    if (n > 50) return { ok: false, error: "Too many copies of this product already exist." };
    slug = `${base}-${n}`;
  }
  const title = `${source.title.slice(0, 143)} (copy)`;
  const input: ProductInput = {
    title,
    slug,
    categoryId: source.categoryId,
    shortDescription: source.shortDescription,
    description: source.description,
    regularPrice: source.regularPrice,
    discountPrice: source.discountPrice,
    colors: source.colors,
    specs: source.specs,
    sku: null,
    material: source.material,
    dimensions: source.dimensions,
    isMadeToOrder: source.isMadeToOrder,
    keywords: source.keywords,
    status: "DRAFT",
    isPopular: source.isPopular,
    isNewArrival: source.isNewArrival,
    seoTitle: source.seoTitle,
    seoDescription: source.seoDescription,
  };
  const newId = await insertProduct(toData(input, categoryName, null, new Date()), input);
  return { ok: true, data: { id: newId } };
}

export async function deleteProduct(id: number): Promise<SaveResult<{ slug: string } | null>> {
  const current = await findProductForEdit(id);
  if (!current) return { ok: true, data: null };
  const paths = await removeProduct(id);
  // After the row is gone: a failed R2 delete leaves an orphan object, never a broken page.
  for (const path of paths) {
    try {
      await discardImage(path);
    } catch (err) {
      console.error("[product.delete] image cleanup failed", path, err);
    }
  }
  return { ok: true, data: { slug: current.slug } };
}

// --- Images ------------------------------------------------------------------------------------

export type AdminProductImage = AdminProductRow["images"][number];

export async function addProductImage(
  productId: number,
  file: File,
): Promise<SaveResult<{ image: AdminProductImage; slug: string }>> {
  const product = await findProductForEdit(productId);
  if (!product) return { ok: false, error: "This product no longer exists." };
  if ((await countProductImages(productId)) >= MAX_PRODUCT_IMAGES) {
    return { ok: false, error: `A product can have up to ${MAX_PRODUCT_IMAGES} photos.` };
  }
  const upload = await storeImage(file, "products");
  if (!upload.ok) return { ok: false, error: upload.error };
  try {
    const image = await insertProductImage({
      productId,
      path: upload.image.path,
      // A sensible default the admin can refine; alt text is never empty.
      alt: product.title.slice(0, 160),
      width: upload.image.width,
      height: upload.image.height,
    });
    await touchProduct(productId);
    return { ok: true, data: { image, slug: product.slug } };
  } catch (err) {
    await discardImage(upload.image.path);
    throw err;
  }
}

type ImageResult = SaveResult<{ slug: string }>;

const IMAGE_GONE: ImageResult = { ok: false, error: "This photo no longer exists." };

export async function setImageAlt(imageId: number, alt: string): Promise<ImageResult> {
  const image = await findProductImage(imageId);
  if (!image) return IMAGE_GONE;
  await updateImageAlt(imageId, alt);
  return { ok: true, data: { slug: image.product.slug } };
}

export async function setPrimaryImage(imageId: number): Promise<ImageResult> {
  const image = await findProductImage(imageId);
  if (!image) return IMAGE_GONE;
  await makeImagePrimary(image.productId, imageId);
  await touchProduct(image.productId);
  return { ok: true, data: { slug: image.product.slug } };
}

export async function moveImage(imageId: number, direction: "up" | "down"): Promise<ImageResult> {
  const image = await findProductImage(imageId);
  if (!image) return IMAGE_GONE;
  const ids = await findImageIds(image.productId);
  const index = ids.indexOf(imageId);
  const target = direction === "up" ? index - 1 : index + 1;
  if (index !== -1 && target >= 0 && target < ids.length) {
    [ids[index], ids[target]] = [ids[target]!, ids[index]!];
    await reorderImages(ids);
  }
  return { ok: true, data: { slug: image.product.slug } };
}

export async function deleteImage(imageId: number): Promise<ImageResult> {
  const image = await findProductImage(imageId);
  if (!image) return IMAGE_GONE;
  await removeProductImage(imageId, image.productId, image.isPrimary);
  await touchProduct(image.productId);
  await discardImage(image.path);
  return { ok: true, data: { slug: image.product.slug } };
}
