"use server";
// Journal (07 §3.4): requireAdmin → Zod → service → revalidate (07 §5: blog, post:<slug>, home).
import { updateTag } from "next/cache";
import { invalid, type ActionResult } from "@/lib/action-result";
import { postSchema } from "@/lib/validation/blog";
import { idSchema } from "@/lib/validation/home";
import { requireAdmin } from "@/server/services/auth.service";
import {
  createPost,
  deletePost,
  updatePost,
  uploadPostImage,
} from "@/server/services/blog-admin.service";
import type { SaveResult } from "@/server/services/home-admin.service";
import { pickFile } from "@/server/services/media.service";

function fail(result: Extract<SaveResult<unknown>, { ok: false }>): ActionResult<never> {
  return {
    ok: false,
    error: result.error,
    fieldErrors: result.field ? { [result.field]: [result.error] } : undefined,
  };
}

function revalidatePost(...slugs: string[]): void {
  updateTag("blog");
  updateTag("home");
  for (const slug of new Set(slugs)) updateTag(`post:${slug}`);
}

function fieldsOf(formData: FormData): Record<string, FormDataEntryValue> {
  const fields = Object.fromEntries(formData);
  delete fields.id;
  delete fields.cover;
  return fields;
}

export async function createPostAction(
  _prev: ActionResult<{ id: number }> | null,
  formData: FormData,
): Promise<ActionResult<{ id: number }>> {
  await requireAdmin();
  const parsed = postSchema.safeParse(fieldsOf(formData));
  if (!parsed.success) return invalid(parsed.error);
  const result = await createPost(parsed.data, pickFile(formData.get("cover")));
  if (!result.ok) return fail(result);
  revalidatePost(result.data.slug);
  return { ok: true, data: { id: result.data.id }, message: "Post created." };
}

export async function updatePostAction(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  await requireAdmin();
  const id = idSchema.safeParse(formData.get("id"));
  if (!id.success) return { ok: false, error: "Unknown post." };
  const parsed = postSchema.safeParse(fieldsOf(formData));
  if (!parsed.success) return invalid(parsed.error);
  const result = await updatePost(id.data, parsed.data, pickFile(formData.get("cover")));
  if (!result.ok) return fail(result);
  revalidatePost(result.data.oldSlug, result.data.newSlug);
  return { ok: true, message: "Post saved." };
}

export async function deletePostAction(id: number): Promise<ActionResult> {
  await requireAdmin();
  const parsed = idSchema.safeParse(id);
  if (!parsed.success) return { ok: false, error: "Unknown post." };
  const result = await deletePost(parsed.data);
  if (!result.ok) return fail(result);
  if (result.data) revalidatePost(result.data.slug);
  return { ok: true, message: "Post deleted." };
}

/** One image per request (07 §4); the editor inserts the returned key as Markdown. */
export async function uploadPostImageAction(
  formData: FormData,
): Promise<ActionResult<{ path: string }>> {
  await requireAdmin();
  const file = pickFile(formData.get("file"));
  if (!file) return { ok: false, error: "Choose an image." };
  const result = await uploadPostImage(file);
  if (!result.ok) return fail(result);
  return { ok: true, data: result.data };
}
