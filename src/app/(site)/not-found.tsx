import type { Metadata } from "next";
import { NotFoundContent } from "@/components/site/NotFoundContent";

export const metadata: Metadata = {
  title: "Page not found",
  robots: { index: false },
};

/**
 * notFound() inside the public site (missing product, post or category). The site layout already
 * renders the header and footer, so this is only the 404 body (it used to render them twice).
 */
export default function SiteNotFound() {
  return <NotFoundContent />;
}
