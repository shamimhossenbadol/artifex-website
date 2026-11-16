// The printable delivery challan (ADR-046): an A4 sheet in the style of the shop's letterhead
// (shared with the invoice, print/Letterhead.tsx) —
// logo left, address/phones/email right, a brand-red rule, a faint logo watermark — then the
// customer, the items, signatures and the website on a red band. Exactly one A4 page (210 × 297 mm)
// for both the on-screen preview and the print copy; it renders the form and keeps nothing.
import {
  filledItems,
  formatChallanDate,
  parseQuantity,
  totalQuantity,
  type ChallanBusiness,
  type ChallanDraft,
} from "@/lib/challan";
import { cn } from "@/lib/utils";
import {
  A4_SHEET_CLASS,
  SHEET_LABEL as LABEL,
  SheetFooterBand,
  SheetLetterhead,
  SheetWatermark,
  sheetOverflows,
} from "../print/Letterhead";

// Kept here too so existing imports keep working; the shared copy lives in print/Letterhead.
export { sheetOverflows };

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

/** "Driver name / Abdul Malek" on a dotted line (blank when empty, to fill in by hand). */
function DriverField({
  label,
  valueClassName,
  children,
}: {
  label: string;
  valueClassName?: string;
  children: string;
}) {
  return (
    <div className="min-w-0">
      <dt className="text-small text-muted">{label}</dt>
      <dd
        className={cn(
          "text-ink border-muted mt-1 min-h-[7mm] border-b border-dotted pb-0.5 font-medium break-words",
          valueClassName,
        )}
      >
        {children}
      </dd>
    </div>
  );
}

/** Id of the on-screen preview sheet, measured by the form to keep everything on one page. */
export const CHALLAN_PREVIEW_ID = "challan-preview-sheet";

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
      aria-label="Delivery challan / gate pass"
      className={cn(A4_SHEET_CLASS, className)}
    >
      <SheetWatermark />
      <SheetLetterhead business={business} />

      {/* Title with a brand-red accent; salesman and date as labelled blocks with a hairline. */}
      <div className="mt-7 flex items-end justify-between gap-6">
        <div className="min-w-0">
          <h2 className="text-h3 leading-tight whitespace-nowrap">Delivery Challan / Gate Pass</h2>
          <div aria-hidden className="bg-brand mt-3 h-[0.7mm] w-[14mm]" />
        </div>
        <dl className="flex shrink-0 items-stretch">
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

      {/* Optional driver / vehicle details (ADR-066): one compact row; empty values stay blank
          above the dotted line so they can be written in by hand. */}
      {draft.driverEnabled && (
        <section className="border-line mt-5 border-y py-3">
          <p className={LABEL}>Driver &amp; vehicle</p>
          <dl className="mt-2 grid grid-cols-3 gap-6">
            <DriverField label="Driver name">{draft.driverName}</DriverField>
            <DriverField label="Driver phone" valueClassName="tabular-nums">
              {draft.driverPhone}
            </DriverField>
            <DriverField label="Vehicle number">{draft.vehicleNumber}</DriverField>
          </dl>
        </section>
      )}

      {/* Signatures, pushed to the bottom of the page (room above the lines to sign). */}
      <section className="mt-auto pt-12">
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

      <SheetFooterBand website={business.website} />
    </article>
  );
}
