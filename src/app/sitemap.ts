import type { MetadataRoute } from "next";
import { getSitemap } from "@/server/services/sitemap.service";

/** /sitemap.xml (08 §7): home, static pages, active categories, published products and posts. */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  return getSitemap();
}
