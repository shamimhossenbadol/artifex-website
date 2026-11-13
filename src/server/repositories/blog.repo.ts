// Blog post queries (F4). Public queries always filter status = PUBLISHED.
import { db } from "@/lib/db";
import type { Prisma } from "@/generated/prisma/client";

const PUBLISHED = {
  status: "PUBLISHED",
  publishedAt: { not: null },
} satisfies Prisma.BlogPostWhereInput;

export const POST_CARD_SELECT = {
  id: true,
  title: true,
  slug: true,
  excerpt: true,
  coverImagePath: true,
  coverImageAlt: true,
  authorName: true,
  publishedAt: true,
  tags: true,
} satisfies Prisma.BlogPostSelect;

export type PostCardRow = Prisma.BlogPostGetPayload<{ select: typeof POST_CARD_SELECT }>;

export async function findPublishedPosts(skip: number, take: number) {
  const [total, rows] = await db.$transaction([
    db.blogPost.count({ where: PUBLISHED }),
    db.blogPost.findMany({
      where: PUBLISHED,
      orderBy: [{ publishedAt: "desc" }, { id: "desc" }],
      skip,
      take,
      select: POST_CARD_SELECT,
    }),
  ]);
  return { total, rows };
}

const POST_DETAIL_SELECT = {
  ...POST_CARD_SELECT,
  content: true,
  seoTitle: true,
  seoDescription: true,
  updatedAt: true,
} satisfies Prisma.BlogPostSelect;

export type PostDetailRow = Prisma.BlogPostGetPayload<{ select: typeof POST_DETAIL_SELECT }>;

export async function findPublishedPostBySlug(slug: string) {
  return db.blogPost.findFirst({ where: { slug, ...PUBLISHED }, select: POST_DETAIL_SELECT });
}

/** Any status: only for a signed-in admin's draft preview. */
export async function findAnyPostBySlug(slug: string) {
  return db.blogPost.findUnique({ where: { slug }, select: POST_DETAIL_SELECT });
}

/** Recent published posts other than `excludeId`, newest first (for related posts). */
export async function findRecentPosts(excludeId: number, take: number) {
  return db.blogPost.findMany({
    where: { ...PUBLISHED, id: { not: excludeId } },
    orderBy: [{ publishedAt: "desc" }, { id: "desc" }],
    take,
    select: POST_CARD_SELECT,
  });
}
