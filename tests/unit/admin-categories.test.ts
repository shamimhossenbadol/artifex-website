import { beforeEach, describe, expect, it, vi } from "vitest";
import { categorySchema, slugify } from "@/lib/validation/category";

const repo = vi.hoisted(() => ({
  countProductsInCategory: vi.fn(),
  createCategory: vi.fn(),
  deleteCategory: vi.fn(),
  findAllCategoriesForAdmin: vi.fn(),
  findCategoryById: vi.fn(),
  findCategoryIdBySlug: vi.fn(),
  findProductSearchSources: vi.fn(),
  reorderCategories: vi.fn(),
  setCategoryFlag: vi.fn(),
  updateCategory: vi.fn(),
  updateProductSearchTexts: vi.fn(),
}));
const media = vi.hoisted(() => ({ storeImage: vi.fn(), discardImage: vi.fn() }));
vi.mock("next/server", () => ({ connection: async () => undefined }));
vi.mock("@/server/repositories/category.repo", () => repo);
vi.mock("@/server/services/media.service", () => media);

const { createCategory, deleteCategory, moveCategory, updateCategory } =
  await import("@/server/services/category-admin.service");

const form = (data: Record<string, string>) =>
  categorySchema.safeParse({
    name: "Sofas",
    slug: "",
    description: "",
    seoTitle: "",
    seoDescription: "",
    ...data,
  });

const parsed = (data: Record<string, string> = {}) => {
  const r = form(data);
  if (!r.success) throw new Error("expected a valid category form");
  return r.data;
};

const row = (over: Record<string, unknown> = {}) => ({
  id: 1,
  name: "Sofas",
  slug: "sofas",
  description: null,
  imagePath: "categories/2026/11/abcdefghijkl",
  isActive: true,
  showOnHome: true,
  sortOrder: 10,
  seoTitle: null,
  seoDescription: null,
  updatedAt: new Date(),
  _count: { products: 0 },
  ...over,
});

const file = new File(["x"], "a.jpg", { type: "image/jpeg" });

describe("slugify", () => {
  it.each([
    ["Dining Tables", "dining-tables"],
    ["  Beds & Mattresses ", "beds-and-mattresses"],
    ["Café Chairs!", "cafe-chairs"],
    ["---", ""],
  ])("%s → %s", (input, expected) => {
    expect(slugify(input)).toBe(expected);
  });

  it("caps the length without a trailing dash", () => {
    const slug = slugify("a ".repeat(80), 10);
    expect(slug.length).toBeLessThanOrEqual(10);
    expect(slug.endsWith("-")).toBe(false);
  });
});

describe("categorySchema", () => {
  it("derives the slug from the name when blank", () => {
    expect(parsed({ name: "Dining Tables" }).slug).toBe("dining-tables");
  });

  it("normalises a typed slug", () => {
    expect(parsed({ slug: "Living Room Sofas" }).slug).toBe("living-room-sofas");
  });

  it("reads checkboxes as booleans", () => {
    const data = parsed({ isActive: "on" });
    expect(data.isActive).toBe(true);
    expect(data.showOnHome).toBe(false);
    expect(data.removeImage).toBe(false);
  });

  it("requires a name and a usable slug", () => {
    expect(form({ name: "" }).success).toBe(false);
    expect(form({ name: "।।।" }).success).toBe(false);
  });

  it("limits SEO fields", () => {
    expect(form({ seoTitle: "x".repeat(71) }).success).toBe(false);
    expect(form({ seoDescription: "x".repeat(171) }).success).toBe(false);
  });
});

describe("category admin service", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    repo.findCategoryIdBySlug.mockResolvedValue(null);
    media.storeImage.mockResolvedValue({
      ok: true,
      image: { path: "categories/2026/11/newnewnewnew", width: 1, height: 1 },
    });
  });

  it("rejects a slug another category uses", async () => {
    repo.findCategoryIdBySlug.mockResolvedValue(9);
    const result = await createCategory(parsed(), null);
    expect(result).toMatchObject({ ok: false, field: "slug" });
    expect(repo.createCategory).not.toHaveBeenCalled();
  });

  it("removes the uploaded image when the insert fails", async () => {
    repo.createCategory.mockRejectedValue(new Error("db down"));
    await expect(createCategory(parsed(), file)).rejects.toThrow("db down");
    expect(media.discardImage).toHaveBeenCalledWith("categories/2026/11/newnewnewnew");
  });

  it("maps a unique-constraint race to a slug error", async () => {
    repo.createCategory.mockRejectedValue(Object.assign(new Error("dup"), { code: "P2002" }));
    expect(await createCategory(parsed(), null)).toMatchObject({ ok: false, field: "slug" });
  });

  it("allows keeping its own slug and deletes a replaced image after saving", async () => {
    repo.findCategoryById.mockResolvedValue(row());
    repo.findCategoryIdBySlug.mockResolvedValue(1);
    const result = await updateCategory(1, parsed(), file);
    expect(result).toEqual({ ok: true, data: { oldSlug: "sofas", newSlug: "sofas" } });
    expect(repo.updateCategory).toHaveBeenCalledWith(
      1,
      expect.objectContaining({ imagePath: "categories/2026/11/newnewnewnew" }),
    );
    expect(media.discardImage).toHaveBeenCalledWith("categories/2026/11/abcdefghijkl");
    expect(repo.findProductSearchSources).not.toHaveBeenCalled();
  });

  it("removes the image when asked", async () => {
    repo.findCategoryById.mockResolvedValue(row());
    await updateCategory(1, parsed({ removeImage: "on" }), null);
    expect(repo.updateCategory).toHaveBeenCalledWith(
      1,
      expect.objectContaining({ imagePath: null }),
    );
    expect(media.discardImage).toHaveBeenCalledWith("categories/2026/11/abcdefghijkl");
  });

  it("recomputes product search text on rename", async () => {
    repo.findCategoryById.mockResolvedValue(row());
    repo.findProductSearchSources.mockResolvedValue([
      { id: 5, title: "Oslo Sofa", keywords: "couch", material: "Oak", colors: [{ name: "Grey" }] },
    ]);
    await updateCategory(1, parsed({ name: "Sofas & Couches", slug: "sofas" }), null);
    expect(repo.updateProductSearchTexts).toHaveBeenCalledWith([
      { id: 5, searchText: "oslo sofa sofas & couches couch oak grey" },
    ]);
  });

  it("blocks deleting a category that has products", async () => {
    repo.findCategoryById.mockResolvedValue(row());
    repo.countProductsInCategory.mockResolvedValue(3);
    const result = await deleteCategory(1);
    expect(result).toMatchObject({ ok: false });
    expect(!result.ok && result.error).toMatch(/3 products/);
    expect(repo.deleteCategory).not.toHaveBeenCalled();
  });

  it("deletes an empty category and its image", async () => {
    repo.findCategoryById.mockResolvedValue(row());
    repo.countProductsInCategory.mockResolvedValue(0);
    expect(await deleteCategory(1)).toEqual({ ok: true, data: { slug: "sofas" } });
    expect(repo.deleteCategory).toHaveBeenCalledWith(1);
    expect(media.discardImage).toHaveBeenCalledWith("categories/2026/11/abcdefghijkl");
  });

  it("moves a category and ignores moves past the ends", async () => {
    repo.findAllCategoriesForAdmin.mockResolvedValue([{ id: 1 }, { id: 2 }, { id: 3 }]);
    await moveCategory(3, "up");
    expect(repo.reorderCategories).toHaveBeenCalledWith([1, 3, 2]);
    repo.reorderCategories.mockClear();
    await moveCategory(1, "up");
    expect(repo.reorderCategories).not.toHaveBeenCalled();
  });
});
