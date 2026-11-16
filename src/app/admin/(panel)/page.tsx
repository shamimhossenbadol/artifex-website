import {
  AlertTriangle,
  ArrowUpRight,
  FilePenLine,
  FilePlus2,
  FolderTree,
  House,
  Newspaper,
  Package,
  PackagePlus,
} from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";
import { AdminPageHeader, AdminPanel } from "@/components/admin/AdminPageHeader";
import { AnalyticsPanel } from "@/components/admin/dashboard/AnalyticsPanel";
import { Badge } from "@/components/ui/Badge";
import { formatPostDate } from "@/lib/blog";
import { analyticsRangeSchema } from "@/lib/validation/analytics";
import { getAnalyticsSummary } from "@/server/services/analytics.service";
import { requireAdmin } from "@/server/services/auth.service";
import { getDashboard } from "@/server/services/dashboard.service";

export const metadata: Metadata = { title: "Dashboard" };

const QUICK_LINKS = [
  { href: "/admin/products/new", label: "Add product", Icon: PackagePlus },
  { href: "/admin/blog/new", label: "Write a post", Icon: FilePlus2 },
  { href: "/admin/homepage", label: "Edit homepage", Icon: House },
];

/** Analytics shouldn't take the dashboard down (e.g. before the migration has run). */
async function loadAnalytics(range: unknown) {
  // Outside the try: during prerendering connection() rejects on purpose and must reach Next.js
  // (catching it only logged a misleading error).
  await connection();
  try {
    return await getAnalyticsSummary(analyticsRangeSchema.parse(range));
  } catch (err) {
    console.error("[dashboard.analytics]", err);
    return null;
  }
}

export default async function DashboardPage({ searchParams }: PageProps<"/admin">) {
  const admin = await requireAdmin();
  const [{ counts, recent, warnings }, analytics] = await Promise.all([
    getDashboard(),
    searchParams.then((params) => loadAnalytics(params.range)),
  ]);
  const stats = [
    { label: "Published products", value: counts.published, Icon: Package },
    { label: "Draft products", value: counts.drafts, Icon: FilePenLine },
    { label: "Categories", value: counts.categories, Icon: FolderTree },
    { label: "Published posts", value: counts.posts, Icon: Newspaper },
  ];

  return (
    <>
      <AdminPageHeader
        title={`Welcome, ${admin.name}`}
        description="Here's your site at a glance."
      />

      {warnings.length > 0 && (
        <ul className="mb-6 flex flex-col gap-2">
          {warnings.map((w) => (
            <li
              key={w.text}
              className="border-sale/30 bg-sale/5 flex flex-wrap items-center gap-3 rounded-md border px-4 py-3"
            >
              <AlertTriangle aria-hidden strokeWidth={1.5} className="text-sale size-5 shrink-0" />
              <span className="text-ink flex-1">{w.text}</span>
              <Link href={w.href} className="text-walnut font-medium underline underline-offset-4">
                {w.action}
              </Link>
            </li>
          ))}
        </ul>
      )}

      {analytics ? (
        <AnalyticsPanel summary={analytics} />
      ) : (
        <p className="admin-card text-ink-soft mb-8 px-4 py-3">
          Visitor numbers can&apos;t be loaded right now. Please try again later.
        </p>
      )}

      <h2 className="text-h3 mb-3">Catalogue</h2>
      <dl className="admin-stagger mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
        {stats.map(({ label, value, Icon }) => (
          <div key={label} className="admin-card admin-lift p-4 sm:p-5">
            <dt className="text-small text-muted flex items-start justify-between gap-2">
              {label}
              <span className="bg-gold/12 text-gold-dark inline-flex size-8 shrink-0 items-center justify-center rounded-full">
                <Icon aria-hidden strokeWidth={1.5} className="size-4" />
              </span>
            </dt>
            <dd className="text-h2 mt-1 lining-nums tabular-nums">{value}</dd>
          </div>
        ))}
      </dl>

      <div className="grid gap-6 lg:grid-cols-3">
        <AdminPanel title="Quick actions">
          <ul className="flex flex-col gap-2">
            {QUICK_LINKS.map(({ href, label, Icon }) => (
              <li key={href}>
                <Link
                  href={href}
                  className="group border-line text-ink hover:border-gold hover:bg-bg flex min-h-12 items-center gap-3 rounded-md border px-3 font-medium transition-colors duration-200"
                >
                  <span className="bg-gold/12 text-gold-dark inline-flex size-8 items-center justify-center rounded-full">
                    <Icon aria-hidden strokeWidth={1.5} className="size-4" />
                  </span>
                  <span className="flex-1">{label}</span>
                  <ArrowUpRight
                    aria-hidden
                    strokeWidth={1.5}
                    className="text-muted size-4 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                  />
                </Link>
              </li>
            ))}
          </ul>
        </AdminPanel>

        <div className="lg:col-span-2">
          <AdminPanel title="Recently updated products">
            {recent.length === 0 ? (
              <p className="text-muted">No products yet.</p>
            ) : (
              <ul className="admin-stagger divide-line divide-y">
                {recent.map((p) => (
                  <li key={p.id} className="flex flex-wrap items-center gap-x-3 gap-y-1 py-3">
                    <Link
                      href={`/admin/products/${p.id}`}
                      className="text-ink min-w-0 flex-1 truncate font-medium hover:underline"
                    >
                      {p.title}
                    </Link>
                    <span className="text-muted">{p.category.name}</span>
                    <Badge variant={p.status === "PUBLISHED" ? "neutral" : "sale"}>
                      {p.status === "PUBLISHED" ? "Published" : "Draft"}
                    </Badge>
                    <span className="text-small text-muted tabular-nums">
                      {formatPostDate(p.updatedAt)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </AdminPanel>
        </div>
      </div>
    </>
  );
}
