import { beforeEach, describe, expect, it, vi } from "vitest";
import { defaultSpecsFor, specPresetsFor } from "@/lib/spec-presets";
import { adminProductQuerySchema, productSchema } from "@/lib/validation/product";

const repo = vi.hoisted(() => ({
  countProductImages: vi.fn(),
  findAdminProducts: vi.fn(),
  findCategoryName: vi.fn(),
  findCategoryOptions: vi.fn(),
  findImageIds: vi.fn(),
  findProductForEdit: vi.fn(),
  findProductIdBySlug: vi.fn(),
  findProductImage: vi.fn(),
  findProductStatus: vi.fn(),
  insertProduct: vi.fn(),
  insertProductImage: vi.fn(),
  makeImagePrimary: vi.fn(),
  removeProduct: vi.fn(),
  removeProductImage: vi.fn(),
  reorderImages: vi.fn(),
  touchProduct: vi.fn(),
  updateImageAlt: vi.fn(),
  writeProduct: vi.fn(),
  writeProductStatus: vi.fn(),
}));
const media = vi.hoisted(() => ({ storeImage: vi.fn(), discardImage: vi.fn() }));
vi.mock("next/server", () => ({ connection: async () => undefined }));
vi.mock("@/server/repositories/product-admin.repo", () => repo);
vi.mock("@/server/services/media.service", () => media);

const service = await import("@/server/services/product-admin.service");

const FORM = {
  title: "Oslo 3-Seater Sofa",
  slug: "",
  categoryId: "1",
  shortDescription: "A deep, comfortable sofa.",
  description: "",
  regularPrice: "45,500",
  discountPrice: "",
  specs: "[]",
  keywords: "",
  status: "DRAFT",
  seoTitle: "",
};

const parse = (over: Record<string, string> = {}) => productSchema.safeParse({ ...FORM, ...over });
const input = (over: Record<string, string> = {}) => {
  const r = parse(over);
  if (!r.success) throw new Error(JSON.stringify(r.error.issues));
  return r.data;
};
const errorPaths = (over: Record<string, string>) => {
  const r = parse(over);
  return r.success ? [] : r.error.issues.map((i) => i.path.join("."));
};

const editRow = (over: Record<string, unknown> = {}) => ({
  id: 7,
  title: "Oslo 3-Seater Sofa",
  slug: "oslo-3-seater-sofa",
  categoryId: 1,
  shortDescription: "A deep sofa.",
  description: "",
  regularPrice: 45500,
  discountPrice: null,
  isMadeToOrder: false,
  isPopular: true,
  isNewArrival: false,
  status: "PUBLISHED",
  publishedAt: new Date("2026-11-01T00:00:00Z"),
  keywords: null,
  seoTitle: null,
  updatedAt: new Date(),
  category: { slug: "sofas", isActive: true },
  images: [],
  specs: [{ label: "Frame", value: "Oak" }],
  ...over,
});

describe("productSchema", () => {
  it("derives the slug, parses prices and reads checkboxes", () => {
    const data = input({ isPopular: "on" });
    expect(data.slug).toBe("oslo-3-seater-sofa");
    expect(data.regularPrice).toBe(45500);
    expect(data.discountPrice).toBeNull();
    expect(data.isPopular).toBe(true);
    expect(data.isNewArrival).toBe(false);
    expect(data.categoryId).toBe(1);
  });

  it("allows Price on request", () => {
    expect(input({ regularPrice: "" }).regularPrice).toBeNull();
  });

  it("rejects bad prices", () => {
    expect(errorPaths({ regularPrice: "12.50" })).toContain("regularPrice");
    expect(errorPaths({ discountPrice: "50000" })).toContain("discountPrice");
    expect(errorPaths({ regularPrice: "", discountPrice: "100" })).toContain("discountPrice");
  });

  it("requires a category, title and short description", () => {
    expect(errorPaths({ categoryId: "" })).toContain("categoryId");
    expect(errorPaths({ title: " " })).toContain("title");
    expect(errorPaths({ shortDescription: "" })).toContain("shortDescription");
    expect(errorPaths({ shortDescription: "x".repeat(301) })).toContain("shortDescription");
  });

  it("parses specs with per-row errors", () => {
    const data = input({
      specs: JSON.stringify([{ label: "Frame", value: "Mahogany" }]),
    });
    expect(data.specs).toEqual([{ label: "Frame", value: "Mahogany" }]);
    expect(errorPaths({ specs: JSON.stringify([{ label: "", value: "" }]) })).toEqual(
      expect.arrayContaining(["specs.0.label", "specs.0.value"]),
    );
    expect(errorPaths({ specs: "not json" })).toContain("specs");
  });

  it("only accepts the two statuses", () => {
    expect(errorPaths({ status: "ARCHIVED" })).toContain("status");
  });
});

describe("adminProductQuerySchema", () => {
  it("falls back on invalid values", () => {
    expect(
      adminProductQuerySchema.parse({
        q: "  sofa ",
        status: "nope",
        flag: "no-images",
        sort: "x",
        page: "-2",
        category: "../x",
      }),
    ).toEqual({
      q: "sofa",
      status: undefined,
      flag: "no-images",
      sort: undefined,
      page: 1,
      category: undefined,
    });
  });
});

describe("specPresetsFor / defaultSpecsFor", () => {
  it("gives dining tables twelve default rows, other categories none (ADR-059)", () => {
    const dining = defaultSpecsFor("dining-tables");
    expect(dining).toHaveLength(12);
    expect(dining[0]).toBe("Product Name");
    expect(dining).toContain("Number of Chairs");
    expect(defaultSpecsFor("sofas")).toEqual([]);
    expect(defaultSpecsFor(null)).toEqual([]);
    // Removed defaults can be added back with Quick add.
    for (const label of dining) expect(specPresetsFor("dining-tables")).toContain(label);
  });

  it("has category presets and a general fallback", () => {
    expect(specPresetsFor("sofas")).toContain("Seating capacity");
    expect(specPresetsFor("unknown")).toContain("Warranty");
    expect(specPresetsFor(null)).toContain("Material");
  });
});

describe("product admin service", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    repo.findCategoryName.mockResolvedValue("Sofas");
    repo.findProductIdBySlug.mockResolvedValue(null);
    repo.insertProduct.mockResolvedValue(42);
  });

  it("creates a product with search text and effective price", async () => {
    const result = await service.createProduct(
      input({ discountPrice: "40000", keywords: "couch", status: "PUBLISHED" }),
    );
    expect(result).toEqual({ ok: true, data: { id: 42, slug: "oslo-3-seater-sofa" } });
    const [data] = repo.insertProduct.mock.calls[0]!;
    expect(data).toMatchObject({
      effectivePrice: 40000,
      searchText: "oslo 3-seater sofa sofas couch",
      status: "PUBLISHED",
    });
    expect(data.publishedAt).toBeInstanceOf(Date);
  });

  it("drafts have no publish date", async () => {
    await service.createProduct(input());
    expect(repo.insertProduct.mock.calls[0]![0].publishedAt).toBeNull();
  });

  it("rejects a taken slug and an unknown category", async () => {
    repo.findProductIdBySlug.mockResolvedValue(3);
    expect(await service.createProduct(input())).toMatchObject({ ok: false, field: "slug" });
    repo.findProductIdBySlug.mockResolvedValue(null);
    repo.findCategoryName.mockResolvedValue(null);
    expect(await service.createProduct(input())).toMatchObject({ ok: false, field: "categoryId" });
  });

  it("maps a unique-constraint race on the slug", async () => {
    repo.insertProduct.mockRejectedValue(
      Object.assign(new Error("dup"), { code: "P2002", meta: { target: ["slug"] } }),
    );
    expect(await service.createProduct(input())).toMatchObject({ field: "slug" });
  });

  it("searches specification values (ADR-059)", async () => {
    await service.createProduct(
      input({ specs: JSON.stringify([{ label: "Material", value: "Solid Mahogany" }]) }),
    );
    const [data] = repo.insertProduct.mock.calls[0]!;
    expect(data.searchText).toContain("solid mahogany");
    expect(data.searchText).not.toContain("material");
  });

  it("keeps the first publish date and its own slug on update", async () => {
    const publishedAt = new Date("2026-11-01T00:00:00Z");
    repo.findProductForEdit.mockResolvedValue(editRow({ publishedAt }));
    repo.findProductIdBySlug.mockResolvedValue(7);
    const result = await service.updateProduct(
      7,
      input({ slug: "oslo-sofa", status: "PUBLISHED" }),
    );
    expect(result).toEqual({
      ok: true,
      data: { oldSlug: "oslo-3-seater-sofa", newSlug: "oslo-sofa" },
    });
    expect(repo.writeProduct.mock.calls[0]![1].publishedAt).toBe(publishedAt);
  });

  it("duplicates as a draft without images, with a free slug", async () => {
    repo.findProductForEdit.mockResolvedValue(editRow());
    repo.findProductIdBySlug.mockImplementation(async (slug: string) =>
      slug === "oslo-3-seater-sofa-copy" ? 99 : null,
    );
    expect(await service.duplicateProduct(7)).toEqual({ ok: true, data: { id: 42 } });
    const [data] = repo.insertProduct.mock.calls[0]!;
    expect(data).toMatchObject({
      slug: "oslo-3-seater-sofa-copy-2",
      title: "Oslo 3-Seater Sofa (copy)",
      status: "DRAFT",
      publishedAt: null,
      isPopular: true,
    });
    expect(repo.insertProductImage).not.toHaveBeenCalled();
  });

  it("deletes a product, then its photos (cleanup errors don't fail the delete)", async () => {
    repo.findProductForEdit.mockResolvedValue(editRow());
    repo.removeProduct.mockResolvedValue([
      "products/2026/11/aaaaaaaaaaaa",
      "products/2026/11/bbbbbbbbbbbb",
    ]);
    media.discardImage.mockRejectedValueOnce(new Error("R2 down"));
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    expect(await service.deleteProduct(7)).toEqual({
      ok: true,
      data: { slug: "oslo-3-seater-sofa" },
    });
    expect(media.discardImage).toHaveBeenCalledTimes(2);
  });

  describe("status shortcut (ADR-056)", () => {
    it("publishes a draft and stamps the first publish date", async () => {
      repo.findProductStatus.mockResolvedValue({
        slug: "oslo",
        status: "DRAFT",
        publishedAt: null,
      });
      expect(await service.setProductStatus(7, "PUBLISHED")).toEqual({
        ok: true,
        data: { slug: "oslo" },
      });
      const [id, status, publishedAt] = repo.writeProductStatus.mock.calls[0]!;
      expect([id, status]).toEqual([7, "PUBLISHED"]);
      expect(publishedAt).toBeInstanceOf(Date);
    });

    it("keeps the publish date when moving back to draft", async () => {
      const first = new Date("2026-11-01T00:00:00Z");
      repo.findProductStatus.mockResolvedValue({
        slug: "oslo",
        status: "PUBLISHED",
        publishedAt: first,
      });
      await service.setProductStatus(7, "DRAFT");
      expect(repo.writeProductStatus).toHaveBeenCalledWith(7, "DRAFT", first);
    });

    it("does nothing when the status is already set, and reports missing products", async () => {
      repo.findProductStatus.mockResolvedValue({
        slug: "oslo",
        status: "DRAFT",
        publishedAt: null,
      });
      await service.setProductStatus(7, "DRAFT");
      expect(repo.writeProductStatus).not.toHaveBeenCalled();
      repo.findProductStatus.mockResolvedValue(null);
      expect(await service.setProductStatus(8, "PUBLISHED")).toMatchObject({ ok: false });
    });
  });

  describe("images", () => {
    const file = new File(["x"], "a.jpg", { type: "image/jpeg" });

    it("refuses a 6th photo (1 main + 4 gallery) before uploading", async () => {
      repo.findProductForEdit.mockResolvedValue(editRow());
      repo.countProductImages.mockResolvedValue(5);
      expect(await service.addProductImage(7, file)).toMatchObject({
        ok: false,
        error: "A product can have up to 5 photos.",
      });
      expect(media.storeImage).not.toHaveBeenCalled();
    });

    it("still accepts the 5th photo", async () => {
      repo.findProductForEdit.mockResolvedValue(editRow());
      repo.countProductImages.mockResolvedValue(4);
      media.storeImage.mockResolvedValue({ ok: false, error: "stop here" });
      await service.addProductImage(7, file);
      expect(media.storeImage).toHaveBeenCalled();
    });

    it("stores a photo with the title as default alt text", async () => {
      repo.findProductForEdit.mockResolvedValue(editRow());
      repo.countProductImages.mockResolvedValue(0);
      media.storeImage.mockResolvedValue({
        ok: true,
        image: { path: "products/2026/11/cccccccccccc", width: 1600, height: 1200 },
      });
      repo.insertProductImage.mockResolvedValue({ id: 1, isPrimary: true });
      const result = await service.addProductImage(7, file);
      expect(result.ok).toBe(true);
      expect(repo.insertProductImage).toHaveBeenCalledWith(
        expect.objectContaining({ productId: 7, alt: "Oslo 3-Seater Sofa", width: 1600 }),
      );
    });

    it("removes the uploaded photo when saving the row fails", async () => {
      repo.findProductForEdit.mockResolvedValue(editRow());
      repo.countProductImages.mockResolvedValue(0);
      media.storeImage.mockResolvedValue({
        ok: true,
        image: { path: "products/2026/11/dddddddddddd", width: 1, height: 1 },
      });
      repo.insertProductImage.mockRejectedValue(new Error("db"));
      await expect(service.addProductImage(7, file)).rejects.toThrow("db");
      expect(media.discardImage).toHaveBeenCalledWith("products/2026/11/dddddddddddd");
    });

    it("moves and deletes photos", async () => {
      const image = {
        id: 2,
        productId: 7,
        path: "products/2026/11/eeeeeeeeeeee",
        isPrimary: true,
        product: { slug: "oslo" },
      };
      repo.findProductImage.mockResolvedValue(image);
      repo.findImageIds.mockResolvedValue([1, 2, 3]);
      await service.moveImage(2, "down");
      expect(repo.reorderImages).toHaveBeenCalledWith([1, 3, 2]);

      expect(await service.deleteImage(2)).toEqual({ ok: true, data: { slug: "oslo" } });
      expect(repo.removeProductImage).toHaveBeenCalledWith(2, 7, true);
      expect(media.discardImage).toHaveBeenCalledWith("products/2026/11/eeeeeeeeeeee");
    });
  });
});
