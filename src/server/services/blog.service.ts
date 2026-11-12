// Journal (blog) reads (F4). Request-time wrappers around "use cache" loaders, tags blog/post:<slug>.
import { cacheLife, cacheTag } from "next/cache";
import { connection } from "next/server";
import { POSTS_PER_PAGE, parseTags, readingTimeMinutes } from "@/lib/blog";
import {
  findPublishedPostBySlug,
  findPublishedPosts,
  findRecentPosts,
  type PostCardRow,
} from "@/server/repositories/blog.repo";

export type PostCardVM = {
  id: number;
  title: string;
  slug: string;
  href: string;
  excerpt: string;
  cover: { path: string; alt: string } | null;
  authorName: string;
  publishedAt: Date;
  tags: string[];
};

export type PostDetailVM = PostCardVM & {
  content: string;
  readingMinutes: number;
  seoTitle: string | null;
  seoDescription: string | null;
  updatedAt: Date;
};

export type PostListing = { items: PostCardVM[]; total: number; page: number; pageCount: number };

export function postHref(slug: string): string {
  return `/blog/${slug}`;
}

function toCardVM(row: PostCardRow): PostCardVM {
  return {
    id: row.id,
    title: row.title,
    slug: row.slug,
    href: postHref(row.slug),
    excerpt: row.excerpt,
    cover: row.coverImagePath
      ? { path: row.coverImagePath, alt: row.coverImageAlt ?? row.title }
      : null,
    authorName: row.authorName,
    // The repository only returns published posts, which always have publishedAt.
    publishedAt: row.publishedAt ?? new Date(0),
    tags: parseTags(row.tags),
  };
}

async function loadPosts(page: number): Promise<PostListing> {
  "use cache";
  cacheTag("blog");
  cacheLife("hours");
  const { total, rows } = await findPublishedPosts((page - 1) * POSTS_PER_PAGE, POSTS_PER_PAGE);
  return {
    items: rows.map(toCardVM),
    total,
    page,
    pageCount: Math.max(1, Math.ceil(total / POSTS_PER_PAGE)),
  };
}

async function loadPost(slug: string): Promise<PostDetailVM | null> {
  "use cache";
  cacheTag("blog", `post:${slug}`);
  cacheLife("hours");
  const row = await findPublishedPostBySlug(slug);
  if (!row) return null;
  return {
    ...toCardVM(row),
    content: row.content,
    readingMinutes: readingTimeMinutes(row.content),
    seoTitle: row.seoTitle,
    seoDescription: row.seoDescription,
    updatedAt: row.updatedAt,
  };
}

async function loadRelated(postId: number, tags: string[]): Promise<PostCardVM[]> {
  "use cache";
  cacheTag("blog");
  cacheLife("hours");
  // ≤ 3 posts sharing a tag, filled with the latest (F4). At blog scale (tens of posts) a single
  // recent-posts query filtered in memory is simpler than a tag table.
  const recent = (await findRecentPosts(postId, 50)).map(toCardVM);
  const sharing = recent.filter((p) => p.tags.some((t) => tags.includes(t)));
  const rest = recent.filter((p) => !sharing.includes(p));
  return [...sharing, ...rest].slice(0, 3);
}

/** Latest posts for the homepage "From the Journal" section (F6). Never throws. */
export async function getLatestPosts(take = 3): Promise<PostCardVM[]> {
  await connection();
  try {
    return (await loadPosts(1)).items.slice(0, take);
  } catch (err) {
    console.error("[blog.getLatestPosts]", err);
    return [];
  }
}

export async function listPosts(page: number): Promise<PostListing> {
  await connection();
  return loadPosts(page);
}

export async function getPostBySlug(slug: string): Promise<PostDetailVM | null> {
  await connection();
  return loadPost(slug);
}

export async function getRelatedPosts(postId: number, tags: string[]): Promise<PostCardVM[]> {
  await connection();
  try {
    return await loadRelated(postId, tags);
  } catch (err) {
    console.error("[blog.getRelatedPosts]", { postId }, err);
    return [];
  }
}
