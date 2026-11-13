// Journal admin (07 §3.4): list, create/edit with a cover photo and inline images, delete.
// Cover changes follow ADR-031 (upload → save → delete old). Inline images ("Insert image") are
// uploaded on their own; images removed from a post's Markdown are deleted from R2 on save.
import { connection } from "next/server";
import { escapeLike } from "@/lib/search";
import {
  ADMIN_POSTS_PER_PAGE,
  blogImageKeys,
  type AdminPostQuery,
  type PostInput,
} from "@/lib/validation/blog";
import { dhakaStartOfDay, toDhakaDateInput } from "@/lib/validation/home";
import {
  findAdminPosts,
  findPostForEdit,
  findPostIdBySlug,
  insertPost,
  removePost,
  writePost,
  type AdminPostListRow,
  type AdminPostRow,
  type PostData,
} from "@/server/repositories/blog-admin.repo";
import type { SaveResult } from "./home-admin.service";
import { discardImage, storeImage } from "./media.service";

export type { AdminPostListRow, AdminPostRow };

export type AdminPostList = {
  items: AdminPostListRow[];
  total: number;
  page: number;
  pageCount: number;
};

export async function listAdminPosts(query: AdminPostQuery): Promise<AdminPostList> {
  await connection();
  const { total, rows } = await findAdminPosts({
    titleContains: query.q ? escapeLike(query.q) : undefined,
    status: query.status,
    skip: (query.page - 1) * ADMIN_POSTS_PER_PAGE,
    take: ADMIN_POSTS_PER_PAGE,
  });
  return {
    items: rows,
    total,
    page: query.page,
    pageCount: Math.max(1, Math.ceil(total / ADMIN_POSTS_PER_PAGE)),
  };
}

export async function getPostForEdit(id: number): Promise<AdminPostRow | null> {
  await connection();
  return findPostForEdit(id);
}

const NOON_MS = 12 * 60 * 60 * 1000;

/**
 * The stored publish time (07 §3.4: editable for back-dating, never in the future, so a post can't
 * appear early from the cache). Keeps the existing time when the day is unchanged; today means
 * "now"; an earlier day is stored as noon Dhaka time.
 */
export function resolvePublishedAt(
  status: "DRAFT" | "PUBLISHED",
  day: string | null,
  current: Date | null,
  now: Date,
): { ok: true; value: Date | null } | { ok: false; error: string } {
  const today = toDhakaDateInput(now);
  if (day === null) return { ok: true, value: status === "PUBLISHED" ? (current ?? now) : current };
  if (day > today) return { ok: false, error: "The publish date can't be in the future." };
  if (current && toDhakaDateInput(current) === day) return { ok: true, value: current };
  if (day === today) return { ok: true, value: now };
  return { ok: true, value: new Date(dhakaStartOfDay(day).getTime() + NOON_MS) };
}

const SLUG_TAKEN = "Another post already uses this web address.";

function isUniqueViolation(err: unknown): boolean {
  return typeof err === "object" && err !== null && "code" in err && err.code === "P2002";
}

function toData(input: PostInput, cover: string | null, publishedAt: Date | null): PostData {
  return {
    title: input.title,
    slug: input.slug,
    excerpt: input.excerpt,
    content: input.content,
    coverImagePath: cover,
    coverImageAlt: cover ? (input.coverImageAlt ?? input.title.slice(0, 160)) : null,
    authorName: input.authorName,
    tags: input.tags,
    status: input.status,
    publishedAt,
    seoTitle: input.seoTitle,
    seoDescription: input.seoDescription,
  };
}

async function discardAll(paths: Iterable<string | null>): Promise<void> {
  for (const path of paths) {
    try {
      await discardImage(path);
    } catch (err) {
      console.error("[blog] image cleanup failed", path, err);
    }
  }
}

export async function createPost(
  input: PostInput,
  file: File | null,
): Promise<SaveResult<{ id: number; slug: string }>> {
  const publishedAt = resolvePublishedAt(input.status, input.publishDate, null, new Date());
  if (!publishedAt.ok) return { ok: false, error: publishedAt.error, field: "publishDate" };
  if ((await findPostIdBySlug(input.slug)) !== null) {
    return { ok: false, error: SLUG_TAKEN, field: "slug" };
  }
  let cover: string | null = null;
  if (file) {
    const upload = await storeImage(file, "blog");
    if (!upload.ok) return { ok: false, error: upload.error, field: "cover" };
    cover = upload.image.path;
  }
  try {
    const id = await insertPost(toData(input, cover, publishedAt.value));
    return { ok: true, data: { id, slug: input.slug } };
  } catch (err) {
    await discardAll([cover]);
    if (isUniqueViolation(err)) return { ok: false, error: SLUG_TAKEN, field: "slug" };
    throw err;
  }
}

export type UpdatedPost = { oldSlug: string; newSlug: string };

export async function updatePost(
  id: number,
  input: PostInput,
  file: File | null,
): Promise<SaveResult<UpdatedPost>> {
  const current = await findPostForEdit(id);
  if (!current) return { ok: false, error: "This post no longer exists." };
  const publishedAt = resolvePublishedAt(
    input.status,
    input.publishDate,
    current.publishedAt,
    new Date(),
  );
  if (!publishedAt.ok) return { ok: false, error: publishedAt.error, field: "publishDate" };
  const owner = await findPostIdBySlug(input.slug);
  if (owner !== null && owner !== id) return { ok: false, error: SLUG_TAKEN, field: "slug" };

  let cover = input.removeCover ? null : current.coverImagePath;
  if (file) {
    const upload = await storeImage(file, "blog");
    if (!upload.ok) return { ok: false, error: upload.error, field: "cover" };
    cover = upload.image.path;
  }
  try {
    await writePost(id, toData(input, cover, publishedAt.value));
  } catch (err) {
    if (file) await discardAll([cover]);
    if (isUniqueViolation(err)) return { ok: false, error: SLUG_TAKEN, field: "slug" };
    throw err;
  }

  // After saving: drop the replaced cover and inline images no longer in the Markdown.
  const kept = blogImageKeys(input.content);
  const removed = [...blogImageKeys(current.content)].filter((key) => !kept.has(key));
  await discardAll([cover !== current.coverImagePath ? current.coverImagePath : null, ...removed]);
  return { ok: true, data: { oldSlug: current.slug, newSlug: input.slug } };
}

export async function deletePost(id: number): Promise<SaveResult<{ slug: string } | null>> {
  const current = await findPostForEdit(id);
  if (!current) return { ok: true, data: null };
  await removePost(id);
  await discardAll([current.coverImagePath, ...blogImageKeys(current.content)]);
  return { ok: true, data: { slug: current.slug } };
}

/** "Insert image": stores one image and returns its key for the Markdown. */
export async function uploadPostImage(file: File): Promise<SaveResult<{ path: string }>> {
  const upload = await storeImage(file, "blog");
  if (!upload.ok) return { ok: false, error: upload.error };
  return { ok: true, data: { path: upload.image.path } };
}
