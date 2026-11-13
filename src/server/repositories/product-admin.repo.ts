// Admin product queries (07 §3.2). Uncached: the admin always sees current data.
import type { Prisma } from "@/generated/prisma/client";
import { db } from "@/lib/db";
import type { AdminProductFlag, AdminProductSort } from "@/lib/validation/product";

const ADMIN_ROW_SELECT = {
  id: true,
  title: true,
  slug: true,
  status: true,
  regularPrice: true,
  discountPrice: true,
  isPopular: true,
  isNewArrival: true,
  updatedAt: true,
  category: { select: { name: true, isActive: true } },
  images: {
    where: { isPrimary: true },
    take: 1,
    select: { path: true },
  },
  _count: { select: { images: true } },
} satisfies Prisma.ProductSelect;

export type AdminProductListRow = Prisma.ProductGetPayload<{ select: typeof ADMIN_ROW_SELECT }>;

const ORDER_BY: Record<AdminProductSort, Prisma.ProductOrderByWithRelationInput[]> = {
  updated: [{ updatedAt: "desc" }, { id: "desc" }],
  title: [{ title: "asc" }, { id: "asc" }],
  price_asc: [{ effectivePrice: { sort: "asc", nulls: "last" } }, { id: "desc" }],
  price_desc: [{ effectivePrice: { sort: "desc", nulls: "last" } }, { id: "desc" }],
};

const FLAG_WHERE: Record<AdminProductFlag, Prisma.ProductWhereInput> = {
  popular: { isPopular: true },
  new: { isNewArrival: true },
  sale: { discountPrice: { not: null } },
  "no-images": { images: { none: {} } },
};

export async function findAdminProducts(options: {
  /** Already LIKE-escaped. */
  titleContains?: string;
  categorySlug?: string;
  status?: "DRAFT" | "PUBLISHED";
  flag?: AdminProductFlag;
  sort: AdminProductSort;
  skip: number;
  take: number;
}): Promise<{ total: number; rows: AdminProductListRow[] }> {
  const where: Prisma.ProductWhereInput = {
    ...(options.titleContains ? { title: { contains: options.titleContains } } : {}),
    ...(options.categorySlug ? { category: { slug: options.categorySlug } } : {}),
    ...(options.status ? { status: options.status } : {}),
    ...(options.flag ? FLAG_WHERE[options.flag] : {}),
  };
  const [total, rows] = await db.$transaction([
    db.product.count({ where }),
    db.product.findMany({
      where,
      orderBy: ORDER_BY[options.sort],
      skip: options.skip,
      take: options.take,
      select: ADMIN_ROW_SELECT,
    }),
  ]);
  return { total, rows };
}

export async function findCategoryOptions() {
  return db.category.findMany({
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    select: { id: true, name: true, slug: true, isActive: true },
  });
}

export type CategoryOption = Awaited<ReturnType<typeof findCategoryOptions>>[number];

export async function findCategoryName(id: number): Promise<string | null> {
  const row = await db.category.findUnique({ where: { id }, select: { name: true } });
  return row?.name ?? null;
}

const EDIT_SELECT = {
  id: true,
  title: true,
  slug: true,
  categoryId: true,
  shortDescription: true,
  description: true,
  regularPrice: true,
  discountPrice: true,
  sku: true,
  material: true,
  dimensions: true,
  isMadeToOrder: true,
  isPopular: true,
  isNewArrival: true,
  status: true,
  publishedAt: true,
  keywords: true,
  seoTitle: true,
  seoDescription: true,
  updatedAt: true,
  category: { select: { slug: true, isActive: true } },
  images: {
    orderBy: [{ sortOrder: "asc" }, { id: "asc" }],
    select: { id: true, path: true, alt: true, width: true, height: true, isPrimary: true },
  },
  colors: { orderBy: { sortOrder: "asc" }, select: { name: true, hex: true } },
  specs: { orderBy: { sortOrder: "asc" }, select: { label: true, value: true } },
} satisfies Prisma.ProductSelect;

export type AdminProductRow = Prisma.ProductGetPayload<{ select: typeof EDIT_SELECT }>;

export async function findProductForEdit(id: number): Promise<AdminProductRow | null> {
  return db.product.findUnique({ where: { id }, select: EDIT_SELECT });
}

export async function findProductIdBySlug(slug: string): Promise<number | null> {
  const row = await db.product.findUnique({ where: { slug }, select: { id: true } });
  return row?.id ?? null;
}

export async function findProductIdBySku(sku: string): Promise<number | null> {
  const row = await db.product.findUnique({ where: { sku }, select: { id: true } });
  return row?.id ?? null;
}

export type ProductData = {
  title: string;
  slug: string;
  categoryId: number;
  shortDescription: string;
  description: string;
  regularPrice: number | null;
  discountPrice: number | null;
  effectivePrice: number | null;
  sku: string | null;
  material: string | null;
  dimensions: string | null;
  isMadeToOrder: boolean;
  isPopular: boolean;
  isNewArrival: boolean;
  status: "DRAFT" | "PUBLISHED";
  publishedAt: Date | null;
  keywords: string | null;
  searchText: string;
  seoTitle: string | null;
  seoDescription: string | null;
};

export type ProductChildren = {
  colors: { name: string; hex: string }[];
  specs: { label: string; value: string }[];
};

const withOrder = <T extends object>(rows: T[]) =>
  rows.map((row, sortOrder) => ({ ...row, sortOrder }));

export async function insertProduct(data: ProductData, children: ProductChildren): Promise<number> {
  const row = await db.product.create({
    data: {
      ...data,
      colors: { create: withOrder(children.colors) },
      specs: { create: withOrder(children.specs) },
    },
    select: { id: true },
  });
  return row.id;
}

/** Replaces the product's fields, colours and specs in one transaction. */
export async function writeProduct(
  id: number,
  data: ProductData,
  children: ProductChildren,
): Promise<void> {
  await db.$transaction([
    db.product.update({ where: { id }, data }),
    db.productColor.deleteMany({ where: { productId: id } }),
    db.productColor.createMany({
      data: withOrder(children.colors).map((c) => ({ ...c, productId: id })),
    }),
    db.productSpec.deleteMany({ where: { productId: id } }),
    db.productSpec.createMany({
      data: withOrder(children.specs).map((s) => ({ ...s, productId: id })),
    }),
  ]);
}

/** Deletes the product (images, colours and specs cascade) and returns its image paths. */
export async function removeProduct(id: number): Promise<string[]> {
  const images = await db.productImage.findMany({
    where: { productId: id },
    select: { path: true },
  });
  await db.product.delete({ where: { id } });
  return images.map((i) => i.path);
}

// --- Images ------------------------------------------------------------------------------------

export async function countProductImages(productId: number): Promise<number> {
  return db.productImage.count({ where: { productId } });
}

export async function insertProductImage(image: {
  productId: number;
  path: string;
  alt: string;
  width: number;
  height: number;
}) {
  return db.$transaction(async (tx) => {
    // Sequential: one connection per transaction.
    const last = await tx.productImage.aggregate({
      where: { productId: image.productId },
      _max: { sortOrder: true },
    });
    const primaries = await tx.productImage.count({
      where: { productId: image.productId, isPrimary: true },
    });
    return tx.productImage.create({
      data: {
        ...image,
        // The first image becomes the featured one.
        isPrimary: primaries === 0,
        sortOrder: (last._max.sortOrder ?? -1) + 1,
      },
      select: { id: true, path: true, alt: true, width: true, height: true, isPrimary: true },
    });
  });
}

export async function findProductImage(id: number) {
  return db.productImage.findUnique({
    where: { id },
    select: {
      id: true,
      productId: true,
      path: true,
      isPrimary: true,
      product: { select: { slug: true } },
    },
  });
}

export async function updateImageAlt(id: number, alt: string): Promise<void> {
  await db.productImage.update({ where: { id }, data: { alt } });
}

export async function makeImagePrimary(productId: number, imageId: number): Promise<void> {
  await db.$transaction([
    db.productImage.updateMany({ where: { productId }, data: { isPrimary: false } }),
    db.productImage.update({ where: { id: imageId }, data: { isPrimary: true } }),
  ]);
}

export async function findImageIds(productId: number): Promise<number[]> {
  const rows = await db.productImage.findMany({
    where: { productId },
    orderBy: [{ sortOrder: "asc" }, { id: "asc" }],
    select: { id: true },
  });
  return rows.map((r) => r.id);
}

export async function reorderImages(ids: number[]): Promise<void> {
  await db.$transaction(
    ids.map((id, sortOrder) => db.productImage.update({ where: { id }, data: { sortOrder } })),
  );
}

/** Deletes an image row; if it was the featured one, the next image takes over. */
export async function removeProductImage(id: number, productId: number, wasPrimary: boolean) {
  await db.$transaction(async (tx) => {
    await tx.productImage.delete({ where: { id } });
    if (!wasPrimary) return;
    const next = await tx.productImage.findFirst({
      where: { productId },
      orderBy: [{ sortOrder: "asc" }, { id: "asc" }],
      select: { id: true },
    });
    if (next) await tx.productImage.update({ where: { id: next.id }, data: { isPrimary: true } });
  });
}

/** Bumps updatedAt so the list shows recent photo edits. */
export async function touchProduct(id: number): Promise<void> {
  await db.product.update({ where: { id }, data: { updatedAt: new Date() } });
}
