"use client";
// Admin navigation links with the active section highlighted (07 §2).
import {
  ExternalLink,
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
import { cn } from "@/lib/utils";

export const ADMIN_NAV: { href: string; label: string; Icon: LucideIcon }[] = [
  { href: "/admin", label: "Dashboard", Icon: LayoutDashboard },
  { href: "/admin/products", label: "Products", Icon: Package },
  { href: "/admin/categories", label: "Categories", Icon: FolderTree },
  { href: "/admin/blog", label: "Journal", Icon: Newspaper },
  { href: "/admin/homepage", label: "Homepage", Icon: House },
  { href: "/admin/settings", label: "Settings", Icon: Settings },
  { href: "/admin/account", label: "Account", Icon: UserRound },
];

const ITEM =
  "flex min-h-11 items-center gap-3 rounded-md px-3 text-sm font-medium transition-colors";

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
      <ul className="flex flex-col gap-1">
        {ADMIN_NAV.map(({ href, label, Icon }) => (
          <li key={href}>
            <Link
              href={href}
              onClick={onNavigate}
              aria-current={isActive(href) ? "page" : undefined}
              className={cn(
                ITEM,
                isActive(href) ? "bg-ink text-bg" : "text-ink-soft hover:bg-sand hover:text-ink",
              )}
            >
              <Icon aria-hidden strokeWidth={1.5} className="size-5" />
              {label}
            </Link>
          </li>
        ))}
        <li>
          <a
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            className={cn(ITEM, "text-ink-soft hover:bg-sand hover:text-ink")}
          >
            <ExternalLink aria-hidden strokeWidth={1.5} className="size-5" />
            View site
          </a>
        </li>
      </ul>
    </nav>
  );
}
