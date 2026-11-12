import { SiteShell } from "@/components/site/SiteShell";

/** Public site layout: header, footer and the floating WhatsApp button around every page. */
export default function SiteLayout({ children }: LayoutProps<"/">) {
  return <SiteShell>{children}</SiteShell>;
}
