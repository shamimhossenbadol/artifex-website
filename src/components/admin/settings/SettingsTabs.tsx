"use client";
// Settings tab bar (07 §3.6). usePathname() is request data under Cache Components, so the
// highlighted version renders inside <Suspense> with SettingsTabLinks as the fallback.
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

export const SETTINGS_TABS = [
  { href: "/admin/settings", label: "Business" },
  { href: "/admin/settings/contact", label: "Contact" },
  { href: "/admin/settings/location", label: "Location" },
  { href: "/admin/settings/social", label: "Social" },
  { href: "/admin/settings/seo", label: "SEO" },
  { href: "/admin/settings/tracking", label: "Tracking" },
] as const;

export function SettingsTabs() {
  return <SettingsTabLinks pathname={usePathname()} />;
}

export function SettingsTabLinks({ pathname }: { pathname: string | null }) {
  return (
    <nav aria-label="Settings sections" className="-mx-4 mb-6 overflow-x-auto px-4 sm:mx-0 sm:px-0">
      <ul className="border-line flex min-w-max gap-1 border-b">
        {SETTINGS_TABS.map(({ href, label }) => {
          const active = pathname === href;
          return (
            <li key={href}>
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "-mb-px flex min-h-11 items-center border-b-2 px-4 text-sm font-medium transition-colors",
                  active ? "border-ink text-ink" : "text-muted hover:text-ink border-transparent",
                )}
              >
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
