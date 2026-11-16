"use client";
// Admin navigation links with the active section highlighted (07 §2, ADR-055).
import {
  ClipboardList,
  FolderTree,
  House,
  LayoutDashboard,
  Newspaper,
  Package,
  Settings,
  UserRound,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { CSSProperties } from "react";
import { cn } from "@/lib/utils";

export const ADMIN_NAV: { href: string; label: string; Icon: LucideIcon }[] = [
  { href: "/admin", label: "Dashboard", Icon: LayoutDashboard },
  { href: "/admin/products", label: "Products", Icon: Package },
  { href: "/admin/categories", label: "Categories", Icon: FolderTree },
  { href: "/admin/blog", label: "Journal", Icon: Newspaper },
  { href: "/admin/homepage", label: "Homepage", Icon: House },
  { href: "/admin/challan", label: "Challan", Icon: ClipboardList },
  { href: "/admin/settings", label: "Settings", Icon: Settings },
  { href: "/admin/account", label: "Account", Icon: UserRound },
];

/** Shared look for sidebar rows (nav links, View site, Log out) on the espresso sidebar. */
export const SIDEBAR_ITEM =
  "admin-nav-link flex h-[clamp(2.25rem,5.4vh,2.75rem)] w-full items-center gap-3 rounded-md px-3 text-[13.5px] font-medium";
export const SIDEBAR_IDLE = "text-espresso-muted hover:bg-espresso-soft hover:text-bg";

/**
 * The nav, highlighting the current section. usePathname() is request data under Cache
 * Components, so this is rendered inside <Suspense> with AdminNavLinks (no highlight) as fallback.
 */
export function AdminNav({ onNavigate }: { onNavigate?: () => void }) {
  return <AdminNavLinks pathname={usePathname()} onNavigate={onNavigate} />;
}

export function AdminNavLinks({
  pathname,
  onNavigate,
}: {
  pathname: string | null;
  onNavigate?: () => void;
}) {
  const isActive = (href: string) =>
    pathname !== null &&
    (href === "/admin"
      ? pathname === "/admin"
      : pathname === href || pathname.startsWith(`${href}/`));

  return (
    <nav aria-label="Admin">
      <ul className="flex flex-col gap-0.5">
        {ADMIN_NAV.map(({ href, label, Icon }, index) => {
          const active = isActive(href);
          return (
            <li key={href} className="animate-admin-nav" style={{ "--i": index } as CSSProperties}>
              <Link
                href={href}
                onClick={onNavigate}
                aria-current={active ? "page" : undefined}
                className={cn(
                  SIDEBAR_ITEM,
                  active ? "bg-espresso-soft text-bg shadow-card" : SIDEBAR_IDLE,
                )}
              >
                <Icon
                  aria-hidden
                  strokeWidth={1.5}
                  className={cn("size-[18px] shrink-0", active && "text-gold")}
                />
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
