import { beforeEach, describe, expect, it, vi } from "vitest";
import { adminPostQuerySchema, blogImageKeys, postSchema } from "@/lib/validation/blog";

const repo = vi.hoisted(() => ({
  findAdminPosts: vi.fn(),
  findPostForEdit: vi.fn(),
  findPostIdBySlug: vi.fn(),
  insertPost: vi.fn(),
  removePost: vi.fn(),
  writePost: vi.fn(),
}));
const media = vi.hoisted(() => ({ storeImage: vi.fn(), discardImage: vi.fn() }));
vi.mock("next/server", () => ({ connection: async () => undefined }));
vi.mock("@/server/repositories/blog-admin.repo", () => repo);
vi.mock("@/server/services/media.service", () => media);

const { createPost, deletePost, resolvePublishedAt, updatePost } =
  await import("@/server/services/blog-admin.service");

const FORM = {
  title: "Caring for Solid Wood",
  slug: "",
  excerpt: "Keep wood beautiful in humid weather.",
  content: "Some **text**.",
  coverImageAlt: "",
  authorName: "Artifex Team",
  tags: "",
  status: "DRAFT",
  publishDate: "",
  seoTitle: "",
  seoDescription: "",
};

const input = (over: Record<string, string> = {}) => {
  const r = postSchema.safeParse({ ...FORM, ...over });
  if (!r.success) throw new Error(JSON.stringify(r.error.issues));
  return r.data;
};

const IMG_A = "blog/2026/11/aaaaaaaaaaaa";
const IMG_B = "blog/2026/11/bbbbbbbbbbbb";
const COVER = "blog/2026/11/cccccccccccc";

const row = (over: Record<string, unknown> = {}) => ({
  id: 3,
  title: "Caring for Solid Wood",
  slug: "caring-for-solid-wood",
  excerpt: "x",
  content: `Intro\n\n![a](${IMG_A})\n\n![b](${IMG_B})`,
  coverImagePath: COVER,
  coverImageAlt: "Oak table",
  authorName: "Artifex Team",
  tags: null,
  status: "PUBLISHED",
  publishedAt: new Date("2026-11-01T06:00:00Z"),
  seoTitle: null,
  seoDescription: null,
  updatedAt: new Date(),
  ...over,
});

describe("postSchema", () => {
  it("derives the slug and normalises tags", () => {
    const data = input({ tags: "Sofas, living room ,sofas" });
    expect(data.slug).toBe("caring-for-solid-wood");
    expect(data.tags).toBe("sofas, living room");
    expect(data.publishDate).toBeNull();
  });

  it("requires title, excerpt, content and author", () => {
    for (const field of ["title", "excerpt", "content", "authorName"]) {
      expect(postSchema.safeParse({ ...FORM, [field]: " " }).success).toBe(false);
    }
  });

  it("validates the date format", () => {
    expect(postSchema.safeParse({ ...FORM, publishDate: "2026-13-40" }).success).toBe(false);
    expect(input({ publishDate: "2026-11-01" }).publishDate).toBe("2026-11-01");
  });
});

describe("adminPostQuerySchema", () => {
  it("ignores invalid values", () => {
    expect(adminPostQuerySchema.parse({ q: " wood ", status: "X", page: "0" })).toEqual({
      q: "wood",
      status: undefined,
      page: 1,
    });
  });
});

describe("blogImageKeys", () => {
  it("finds uploaded blog image keys only", () => {
    const md = `![x](${IMG_A}) and ![y](products/2026/11/dddddddddddd) ![z](${IMG_A})`;
    expect([...blogImageKeys(md)]).toEqual([IMG_A]);
  });
});

describe("resolvePublishedAt", () => {
  // 13 Nov 2026, 15:00 in Dhaka.
  const now = new Date("2026-11-13T09:00:00Z");

  it("drafts keep their date; publishing without a date uses now or the existing date", () => {
    expect(resolvePublishedAt("DRAFT", null, null, now)).toEqual({ ok: true, value: null });
    expect(resolvePublishedAt("PUBLISHED", null, null, now)).toEqual({ ok: true, value: now });
    const earlier = new Date("2026-11-01T06:00:00Z");
    expect(resolvePublishedAt("PUBLISHED", null, earlier, now)).toEqual({
      ok: true,
      value: earlier,
    });
  });

  it("rejects future dates (Dhaka calendar)", () => {
    expect(resolvePublishedAt("PUBLISHED", "2026-11-14", null, now).ok).toBe(false);
    expect(resolvePublishedAt("PUBLISHED", "2026-11-13", null, now)).toEqual({
      ok: true,
      value: now,
    });
  });

  it("keeps the time when the day is unchanged and back-dates to noon Dhaka", () => {
    const current = new Date("2026-11-01T06:00:00Z"); // 1 Nov, 12:00 Dhaka
    expect(resolvePublishedAt("PUBLISHED", "2026-11-01", current, now)).toEqual({
      ok: true,
      value: current,
    });
    expect(resolvePublishedAt("PUBLISHED", "2026-10-05", current, now)).toEqual({
      ok: true,
      value: new Date("2026-10-05T06:00:00Z"),
    });
  });
});

describe("blog admin service", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    repo.findPostIdBySlug.mockResolvedValue(null);
    repo.insertPost.mockResolvedValue(9);
  });

  it("creates a post and uses the title as cover alt when blank", async () => {
    media.storeImage.mockResolvedValue({ ok: true, image: { path: COVER, width: 1, height: 1 } });
    const file = new File(["x"], "c.jpg", { type: "image/jpeg" });
    expect(await createPost(input({ status: "PUBLISHED" }), file)).toEqual({
      ok: true,
      data: { id: 9, slug: "caring-for-solid-wood" },
    });
    expect(repo.insertPost).toHaveBeenCalledWith(
      expect.objectContaining({ coverImagePath: COVER, coverImageAlt: "Caring for Solid Wood" }),
    );
    expect(repo.insertPost.mock.calls[0]![0].publishedAt).toBeInstanceOf(Date);
  });

  it("rejects a taken slug and a future date", async () => {
    repo.findPostIdBySlug.mockResolvedValue(1);
    expect(await createPost(input(), null)).toMatchObject({ ok: false, field: "slug" });
    expect(await createPost(input({ publishDate: "2999-01-01" }), null)).toMatchObject({
      ok: false,
      field: "publishDate",
    });
  });

  it("deletes inline images removed from the content after saving", async () => {
    repo.findPostForEdit.mockResolvedValue(row());
    repo.findPostIdBySlug.mockResolvedValue(3);
    const result = await updatePost(3, input({ content: `Intro\n\n![a](${IMG_A})` }), null);
    expect(result.ok).toBe(true);
    expect(media.discardImage).toHaveBeenCalledWith(IMG_B);
    expect(media.discardImage).not.toHaveBeenCalledWith(IMG_A);
    expect(media.discardImage).not.toHaveBeenCalledWith(COVER);
  });

  it("removes the cover when asked", async () => {
    repo.findPostForEdit.mockResolvedValue(row({ content: "x" }));
    await updatePost(3, input({ removeCover: "on" }), null);
    expect(repo.writePost).toHaveBeenCalledWith(
      3,
      expect.objectContaining({ coverImagePath: null, coverImageAlt: null }),
    );
    expect(media.discardImage).toHaveBeenCalledWith(COVER);
  });

  it("deletes a post with its cover and inline images", async () => {
    repo.findPostForEdit.mockResolvedValue(row());
    expect(await deletePost(3)).toEqual({ ok: true, data: { slug: "caring-for-solid-wood" } });
    expect(media.discardImage.mock.calls.map((c) => c[0])).toEqual([COVER, IMG_A, IMG_B]);
  });
});
