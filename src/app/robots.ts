import type { MetadataRoute } from "next";
import { absoluteUrl } from "@/lib/seo";

/** /robots.txt (08 §7): crawl the public site, not admin, API or search results. */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/admin", "/api", "/search"] },
    sitemap: absoluteUrl("/sitemap.xml"),
  };
}
