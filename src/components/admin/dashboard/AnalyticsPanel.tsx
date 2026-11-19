// Dashboard KPIs (ADR-040): visitors, views and contact clicks for the chosen period, each with
// the change against the period before, plus top products and pages. Server component, no JS.
import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react";
import Link from "next/link";
import {
  ANALYTICS_RANGES,
  DEFAULT_ANALYTICS_RANGE,
  describeAnalyticsRange,
  type AnalyticsRange,
} from "@/lib/analytics";
import { cn } from "@/lib/utils";
import type { AnalyticsSummary, Kpi, RankedItem } from "@/server/services/analytics.service";
import { AdminPanel } from "../AdminPageHeader";

const number = new Intl.NumberFormat("en-US");

function Change({ kpi, range }: { kpi: Kpi; range: AnalyticsRange }) {
  const context = `vs ${describeAnalyticsRange(range).comparison}`;
  if (kpi.change === null) {
    return (
      <p className="text-small text-muted mt-1">
        {kpi.value > 0 ? "New this period" : `No data ${context}`}
      </p>
    );
  }
  const Icon = kpi.change > 0 ? ArrowUpRight : kpi.change < 0 ? ArrowDownRight : Minus;
  return (
    <p
      className={cn(
        "text-small mt-1 inline-flex items-center gap-1",
        kpi.change > 0 ? "text-success" : kpi.change < 0 ? "text-danger" : "text-muted",
      )}
    >
      <Icon aria-hidden strokeWidth={1.5} className="size-4" />
      <span>
        {kpi.change > 0 ? "+" : ""}
        {kpi.change}% <span className="text-muted">{context}</span>
      </span>
    </p>
  );
}

function Ranked({ title, items, empty }: { title: string; items: RankedItem[]; empty: string }) {
  return (
    <AdminPanel title={title}>
      {items.length === 0 ? (
        <p className="text-muted">{empty}</p>
      ) : (
        <ol className="divide-line divide-y">
          {items.map((item) => (
            <li key={item.label} className="flex items-center gap-3 py-2.5">
              {item.href ? (
                <Link
                  href={item.href}
                  className="text-ink min-w-0 flex-1 truncate hover:underline"
                  {...(item.href.startsWith("/admin") ? {} : { target: "_blank" })}
                >
                  {item.label}
                </Link>
              ) : (
                <span className="text-ink min-w-0 flex-1 truncate">{item.label}</span>
              )}
              <span className="text-small text-muted tabular-nums">
                {number.format(item.count)}
              </span>
            </li>
          ))}
        </ol>
      )}
    </AdminPanel>
  );
}

export function AnalyticsPanel({ summary }: { summary: AnalyticsSummary }) {
  const { range } = summary;
  const cards = [
    { label: "Visitors", kpi: summary.visitors, hint: "Unique per day" },
    { label: "Page views", kpi: summary.pageViews },
    { label: "Product views", kpi: summary.productViews },
    { label: "Inquiries", kpi: summary.inquiries, hint: "WhatsApp, Messenger and call taps" },
    { label: "WhatsApp taps", kpi: summary.whatsapp },
    { label: "Messenger taps", kpi: summary.messenger },
    { label: "Call taps", kpi: summary.calls },
  ];
  const noData = summary.visitors.value === 0 && summary.pageViews.value === 0;

  return (
    <section aria-labelledby="analytics-title" className="mb-8">
      <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 id="analytics-title" className="text-h3">
            Visitors &amp; inquiries
          </h2>
          <p className="text-small text-muted mt-1">
            Counted by the website itself, without cookies. Your own visits while signed in
            aren&apos;t counted.
          </p>
        </div>
        <nav
          aria-label="Period"
          className="border-line bg-surface shadow-card flex max-w-full overflow-x-auto rounded-md border p-1"
        >
          {ANALYTICS_RANGES.map((option) => (
            <Link
              key={option}
              href={option === DEFAULT_ANALYTICS_RANGE ? "/admin" : `/admin?range=${option}`}
              aria-current={option === range ? "page" : undefined}
              className={cn(
                "text-small inline-flex min-h-11 shrink-0 items-center rounded-sm px-3 font-medium whitespace-nowrap transition-colors",
                option === range
                  ? "bg-espresso text-bg shadow-card"
                  : "text-ink-soft hover:text-ink",
              )}
            >
              {describeAnalyticsRange(option).label}
            </Link>
          ))}
        </nav>
      </div>

      {noData && (
        <p className="admin-card text-ink-soft mb-3 px-4 py-3">
          No visits recorded {describeAnalyticsRange(range).period} yet. Numbers appear here as
          people browse the website.
        </p>
      )}

      <dl className="admin-stagger grid grid-cols-2 gap-3 md:grid-cols-4 lg:gap-4">
        {cards.map((card) => (
          <div key={card.label} className="admin-card admin-lift p-4 sm:p-5">
            <dt className="text-small text-muted">
              {card.label}
              {card.hint && <span className="sr-only"> ({card.hint})</span>}
            </dt>
            <dd>
              <span className="text-h2 mt-1 block lining-nums tabular-nums">
                {number.format(card.kpi.value)}
              </span>
              <Change kpi={card.kpi} range={range} />
            </dd>
          </div>
        ))}
        <div className="admin-card admin-lift p-4 sm:p-5">
          <dt className="text-small text-muted">Inquiry rate</dt>
          <dd>
            <span className="text-h2 mt-1 block lining-nums tabular-nums">
              {summary.inquiryRate === null ? "–" : `${summary.inquiryRate}%`}
            </span>
            <p className="text-small text-muted mt-1">Inquiries per 100 visitors</p>
          </dd>
        </div>
      </dl>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <Ranked
          title="Most viewed products"
          items={summary.topViewedProducts}
          empty="No product views yet."
        />
        <Ranked
          title="Most inquired products"
          items={summary.topInquiredProducts}
          empty="No inquiries from product pages yet."
        />
        <Ranked title="Top pages" items={summary.topPages} empty="No page views yet." />
      </div>
    </section>
  );
}
