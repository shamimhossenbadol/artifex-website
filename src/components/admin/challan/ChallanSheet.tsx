// The printable delivery challan (ADR-046): an A4 sheet in the style of the shop's letterhead —
// logo left, address/phones/email right, a brand-red rule, a faint logo watermark — then the
// customer, the items, signatures and the website on a red band. Exactly one A4 page (210 × 297 mm)
// for both the on-screen preview and the print copy; it renders the form and keeps nothing.
import Image from "next/image";
import fullLogo from "@/assets/brand/artifex-logo.svg";
import {
  filledItems,
  formatChallanDate,
  parseQuantity,
  totalQuantity,
  type ChallanBusiness,
  type ChallanDraft,
} from "@/lib/challan";
import { cn } from "@/lib/utils";

const LABEL = "text-eyebrow text-muted";

/** "Customer Name ........ Rahim Uddin": label left, value right, a dotted leader between. */
function LeaderRow({
  label,
  valueClassName,
  children,
}: {
  label: string;
  valueClassName?: string;
  children: string;
}) {
  return (
    <div className="flex items-baseline gap-3">
      <dt className="text-small text-muted shrink-0">{label}</dt>
      <span aria-hidden className="border-muted min-w-[10mm] flex-1 border-b border-dotted" />
      <dd className={cn("text-ink max-w-[115mm] text-right", valueClassName)}>{children || "—"}</dd>
    </div>
  );
}

/** Id of the on-screen preview sheet, measured by the form to keep everything on one page. */
export const CHALLAN_PREVIEW_ID = "challan-preview-sheet";

/** True when the sheet's content runs past the bottom of the A4 page. */
export function sheetOverflows(sheet: HTMLElement | null): boolean {
  return sheet !== null && sheet.scrollHeight > sheet.clientHeight + 1;
}

export function ChallanSheet({
  draft,
  business,
  id,
  className,
}: {
  draft: ChallanDraft;
  business: ChallanBusiness;
  id?: string;
  className?: string;
}) {
  const items = filledItems(draft.items);
  const total = totalQuantity(draft.items);
  const date = formatChallanDate(draft.date);

  return (
    <article
      id={id}
      aria-label="Delivery challan"
      className={cn(
        "challan-sheet bg-surface text-ink relative isolate flex h-[297mm] w-[210mm] flex-col overflow-hidden px-[16mm] pt-[14mm] pb-[12mm]",
        className,
      )}
    >
      {/* Watermark, as on the printed letterhead. */}
      <Image
        src={fullLogo}
        alt=""
        aria-hidden
        loading="eager"
        className="pointer-events-none absolute top-1/2 left-1/2 -z-10 w-[150mm] max-w-none -translate-x-1/2 -translate-y-1/2 opacity-[0.06]"
      />

      {/* Letterhead */}
      <header className="flex items-start justify-between gap-8">
        <Image src={fullLogo} alt={business.name} loading="eager" className="h-[20mm] w-auto" />
        <div className="text-small text-ink-soft max-w-[105mm] pt-1 text-right leading-relaxed">
          {business.address && <p>{business.address}</p>}
          {business.phones.length > 0 && <p>Cell: {business.phones.join(", ")}</p>}
          <p>Email: {business.email}</p>
        </div>
      </header>
      <div aria-hidden className="border-brand mt-4 border-t-2" />

      {/* Title with a brand-red accent; salesman and date as labelled blocks with a hairline. */}
      <div className="mt-7 flex items-end justify-between gap-8">
        <div>
          <h1 className="text-h2 leading-none">Delivery Challan</h1>
          <div aria-hidden className="bg-brand mt-3 h-[0.7mm] w-[14mm]" />
        </div>
        <dl className="flex items-stretch">
          <div className="pr-6 text-right">
            <dt className={LABEL}>Salesman</dt>
            <dd className="text-body text-ink mt-1.5 font-semibold">{draft.salesmanName || "—"}</dd>
          </div>
          <div className="border-line border-l pl-6 text-right">
            <dt className={LABEL}>Date</dt>
            <dd className="text-body text-ink mt-1.5 font-semibold">{date || "—"}</dd>
          </div>
        </dl>
      </div>

      {/* Delivered to: label left, value right, joined by a dotted leader */}
      <section className="border-line mt-5 border-y py-4">
        <p className={LABEL}>Delivered to</p>
        <dl className="mt-3 flex flex-col gap-2">
          <LeaderRow label="Customer Name" valueClassName="font-semibold">
            {draft.customerName}
          </LeaderRow>
          <LeaderRow label="Phone Number" valueClassName="tabular-nums">
            {draft.customerPhone}
          </LeaderRow>
          <LeaderRow label="Customer Address" valueClassName="whitespace-pre-line">
            {draft.customerAddress}
          </LeaderRow>
        </dl>
      </section>

      {/* Items */}
      <table className="mt-5 w-full border-collapse text-left">
        <thead>
          <tr className="bg-sand text-ink">
            <th scope="col" className="text-small w-[14mm] px-3 py-2.5 font-semibold">
              No.
            </th>
            <th scope="col" className="text-small px-3 py-2.5 font-semibold">
              Item description
            </th>
            <th scope="col" className="text-small w-[24mm] px-3 py-2.5 text-right font-semibold">
              Qty
            </th>
          </tr>
        </thead>
        <tbody>
          {items.length === 0 ? (
            <tr className="border-line border-b">
              <td colSpan={3} className="text-small text-muted px-3 py-6 text-center">
                Items appear here as you add them.
              </td>
            </tr>
          ) : (
            items.map((item, index) => (
              <tr key={item.key} className="border-line border-b align-top">
                <td className="text-small text-muted px-3 py-2 tabular-nums">{index + 1}</td>
                <td className="px-3 py-2 leading-snug">
                  <span className="text-ink font-medium">{item.description}</span>
                  {item.note.trim() && (
                    <span className="text-small text-ink-soft"> · {item.note}</span>
                  )}
                </td>
                <td className="text-ink px-3 py-2 text-right font-medium tabular-nums">
                  {parseQuantity(item.quantity) ?? "—"}
                </td>
              </tr>
            ))
          )}
        </tbody>
        {items.length > 0 && (
          <tfoot>
            <tr>
              <td />
              <td className="text-small text-ink-soft px-3 py-3 text-right font-medium">
                Total quantity
              </td>
              <td className="text-ink px-3 py-3 text-right font-semibold tabular-nums">{total}</td>
            </tr>
          </tfoot>
        )}
      </table>

      {/* Signatures, pushed to the bottom of the page (room above the lines to sign). */}
      <section className="mt-auto pt-14">
        <div className="grid grid-cols-2 gap-16">
          <div className="border-ink border-t pt-2">
            <p className="text-small text-ink font-medium">Customer&apos;s signature</p>
            <p className="text-small text-muted">Date:</p>
          </div>
          <div className="border-ink border-t pt-2 text-right">
            <p className="text-small text-ink font-medium">Salesman&apos;s signature</p>
            {draft.salesmanName && <p className="text-small text-muted">{draft.salesmanName}</p>}
          </div>
        </div>
      </section>

      {/* Website on a brand-red band across the foot of the page. */}
      <footer className="bg-brand text-small -mx-[16mm] mt-10 -mb-[12mm] py-3 text-center font-medium tracking-[0.08em] text-white">
        {business.website}
      </footer>
    </article>
  );
}
