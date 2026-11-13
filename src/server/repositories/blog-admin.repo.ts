// Admin Journal queries (07 §3.4). Uncached: the admin always sees current data.
import type { Prisma } from "@/generated/prisma/client";
import { db } from "@/lib/db";

const LIST_SELECT = {
  id: true,
  title: true,
  slug: true,
  status: true,
  publishedAt: true,
  updatedAt: true,
  coverImagePath: true,
} satisfies Prisma.BlogPostSelect;

export type AdminPostListRow = Prisma.BlogPostGetPayload<{ select: typeof LIST_SELECT }>;

export async function findAdminPosts(options: {
  /** Already LIKE-escaped. */
  titleContains?: string;
  status?: "DRAFT" | "PUBLISHED";
  skip: number;
  take: number;
}): Promise<{ total: number; rows: AdminPostListRow[] }> {
  const where: Prisma.BlogPostWhereInput = {
    ...(options.titleContains ? { title: { contains: options.titleContains } } : {}),
    ...(options.status ? { status: options.status } : {}),
  };
  const [total, rows] = await db.$transaction([
    db.blogPost.count({ where }),
    db.blogPost.findMany({
      where,
      orderBy: [{ updatedAt: "desc" }, { id: "desc" }],
      skip: options.skip,
      take: options.take,
      select: LIST_SELECT,
    }),
  ]);
  return { total, rows };
}

const EDIT_SELECT = {
  id: true,
  title: true,
  slug: true,
  excerpt: true,
  content: true,
  coverImagePath: true,
  coverImageAlt: true,
  authorName: true,
  tags: true,
  status: true,
  publishedAt: true,
  seoTitle: true,
  seoDescription: true,
  updatedAt: true,
} satisfies Prisma.BlogPostSelect;

export type AdminPostRow = Prisma.BlogPostGetPayload<{ select: typeof EDIT_SELECT }>;

export async function findPostForEdit(id: number): Promise<AdminPostRow | null> {
  return db.blogPost.findUnique({ where: { id }, select: EDIT_SELECT });
}

export async function findPostIdBySlug(slug: string): Promise<number | null> {
  const row = await db.blogPost.findUnique({ where: { slug }, select: { id: true } });
  return row?.id ?? null;
}

export type PostData = {
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  coverImagePath: string | null;
  coverImageAlt: string | null;
  authorName: string;
  tags: string | null;
  status: "DRAFT" | "PUBLISHED";
  publishedAt: Date | null;
  seoTitle: string | null;
  seoDescription: string | null;
};

export async function insertPost(data: PostData): Promise<number> {
  const row = await db.blogPost.create({ data, select: { id: true } });
  return row.id;
}

export async function writePost(id: number, data: PostData): Promise<void> {
  await db.blogPost.update({ where: { id }, data });
}

export async function removePost(id: number): Promise<void> {
  await db.blogPost.delete({ where: { id } });
}
