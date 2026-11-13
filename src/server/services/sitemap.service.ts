// Sitemap data (08 §7), cached under the same tags as the pages, so admin changes update it.
import type { MetadataRoute } from "next";
import { cacheLife, cacheTag } from "next/cache";
import { connection } from "next/server";
import { absoluteUrl } from "@/lib/seo";
import { findSitemapEntries } from "@/server/repositories/sitemap.repo";
import { postHref } from "./blog.service";
import { categoryHref, productHref } from "./catalog.service";

const STATIC_PATHS = ["/", "/products", "/blog", "/about", "/contact"];

type Entry = { path: string; lastModified?: Date };

async function loadEntries(): Promise<Entry[]> {
  "use cache";
  cacheTag("products", "categories", "blog");
  cacheLife("hours");
  const { categories, products, posts } = await findSitemapEntries();
  return [
    ...STATIC_PATHS.map((path) => ({ path })),
    ...categories.map((c) => ({ path: categoryHref(c.slug), lastModified: c.updatedAt })),
    ...products.map((p) => ({ path: productHref(p.slug), lastModified: p.updatedAt })),
    ...posts.map((p) => ({ path: postHref(p.slug), lastModified: p.updatedAt })),
  ];
}

export async function getSitemap(): Promise<MetadataRoute.Sitemap> {
  await connection();
  let entries: Entry[];
  try {
    entries = await loadEntries();
  } catch (err) {
    // A database hiccup still serves the static pages rather than an error.
    console.error("[sitemap]", err);
    entries = STATIC_PATHS.map((path) => ({ path }));
  }
  return entries.map((e) => ({
    url: absoluteUrl(e.path),
    ...(e.lastModified ? { lastModified: e.lastModified } : {}),
  }));
}
