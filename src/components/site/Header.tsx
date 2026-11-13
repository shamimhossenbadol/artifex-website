import { getNavCategories } from "@/server/services/catalog.service";
import { getSiteSettings } from "@/server/services/settings.service";
import { getContactLinks } from "./contact-links";
import { HeaderView } from "./HeaderView";

/** Data-backed header. Render inside <Suspense fallback={<HeaderFallback />}> (ADR-020). */
export async function Header() {
  const [settings, categories] = await Promise.all([getSiteSettings(), getNavCategories()]);
  return <HeaderView categories={categories} {...getContactLinks(settings)} />;
}

/** Same layout without data, so nothing shifts when the real header streams in. */
export function HeaderFallback() {
  return <HeaderView categories={[]} phone={null} telHref={null} whatsappHref={null} />;
}
