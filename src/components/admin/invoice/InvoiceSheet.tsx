// The printable invoice (ADR-067): the same letterhead, watermark and red website band as the
// delivery challan (print/Letterhead.tsx), then the customer, an itemised table (qty × unit
// price), the totals (subtotal, optional discount and advance, due) and signatures. Exactly one
// A4 page for both the on-screen preview and the print copy; it renders the form and keeps nothing.
import {
  filledInvoiceItems,
  formatAmount,
  formatInvoiceDate,
  invoiceTotals,
  lineTotal,
  parseAmount,
  type InvoiceDraft,
} from "@/lib/invoice";
import { cn } from "@/lib/utils";
import {
  A4_SHEET_CLASS,
  SHEET_LABEL,
  SheetFooterBand,
  SheetLetterhead,
  SheetWatermark,
  type LetterheadBusiness,
} from "../print/Letterhead";

/** Id of the on-screen preview sheet, measured by the form to keep everything on one page. */
export const INVOICE_PREVIEW_ID = "invoice-preview-sheet";

const TH = "text-small px-2.5 py-1.5 font-semibold";
// Compact rows (ADR-077): 15 items, the totals and the signatures fit one A4 page.
const TD = "px-2.5 py-1 leading-tight";

/** "Name ........ Abu Kashem": label left, value right, a dotted leader between. */
function LeaderRow({
  label,
  valueClassName,
  className,
  children,
}: {
  label: string;
  valueClassName?: string;
  className?: string;
  children: string;
}) {
  return (
    <div className={cn("flex min-w-0 items-baseline gap-3", className)}>
      <dt className="text-small text-muted shrink-0">{label}</dt>
      <span aria-hidden className="border-muted min-w-[10mm] flex-1 border-b border-dotted" />
      <dd className={cn("text-ink max-w-[120mm] min-w-0 text-right", valueClassName)}>
        {children || "—"}
      </dd>
    </div>
  );
}

function TotalRow({
  label,
  value,
  strong = false,
  minus = false,
}: {
  label: string;
  value: number;
  strong?: boolean;
  /** Printed as "− ৳ 500" (a deduction). */
  minus?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex items-baseline justify-between gap-6 px-2.5",
        strong ? "bg-sand text-ink py-1.5 font-semibold" : "py-0.5",
      )}
    >
      <dt className={strong ? "text-body" : "text-small text-ink-soft"}>{label}</dt>
      <dd className={cn("tabular-nums", strong ? "text-body" : "text-ink font-medium")}>
        {minus ? "− " : ""}৳ {formatAmount(value)}
      </dd>
    </div>
  );
}

export function InvoiceSheet({
  draft,
  business,
  id,
  className,
}: {
  draft: InvoiceDraft;
  business: LetterheadBusiness;
  id?: string;
  className?: string;
}) {
  const items = filledInvoiceItems(draft.items);
  const totals = invoiceTotals(draft);
  const date = formatInvoiceDate(draft.date);

  return (
    // Less space above the letterhead than the challan (ADR-078): more room for items.
    <article id={id} aria-label="Invoice" className={cn(A4_SHEET_CLASS, "pt-[9mm]", className)}>
      <SheetWatermark />
      <SheetLetterhead business={business} />

      {/* One compact line: a large "Invoice" title, then invoice no. and date inline (ADR-078). */}
      <div className="mt-4 flex items-baseline justify-between gap-6">
        <h2 className="text-h2 leading-none">Invoice</h2>
        <dl className="text-body flex shrink-0 items-baseline gap-6">
          {draft.invoiceNumber.trim() && (
            <div className="flex items-baseline gap-2">
              <dt className={SHEET_LABEL}>Invoice no.</dt>
              <dd className="text-ink font-semibold tabular-nums">{draft.invoiceNumber}</dd>
            </div>
          )}
          <div className="flex items-baseline gap-2">
            <dt className={SHEET_LABEL}>Date</dt>
            <dd className="text-ink font-semibold">{date || "—"}</dd>
          </div>
        </dl>
      </div>

      {/* Customer: no heading and no rule under it; the table header follows (ADR-078). Name and
          phone share a line to leave room for the items (ADR-077). */}
      <section className="border-line mt-3 border-t pt-3">
        <dl className="grid grid-cols-[3fr_2fr] gap-x-8 gap-y-1.5">
          <LeaderRow
            label="Customer Name"
            valueClassName="font-semibold"
            className={draft.customerPhone.trim() ? undefined : "col-span-2"}
          >
            {draft.customerName}
          </LeaderRow>
          {draft.customerPhone.trim() && (
            <LeaderRow label="Phone Number" valueClassName="tabular-nums">
              {draft.customerPhone}
            </LeaderRow>
          )}
          {draft.customerAddress.trim() && (
            <LeaderRow label="Address" valueClassName="whitespace-pre-line" className="col-span-2">
              {draft.customerAddress}
            </LeaderRow>
          )}
        </dl>
      </section>

      {/* Items */}
      <table className="mt-3 w-full border-collapse text-left">
        <thead>
          <tr className="bg-sand text-ink">
            <th scope="col" className={cn(TH, "w-[11mm]")}>
              SL
            </th>
            <th scope="col" className={TH}>
              Description
            </th>
            <th scope="col" className={cn(TH, "w-[18mm] text-right")}>
              Qty
            </th>
            <th scope="col" className={cn(TH, "w-[16mm]")}>
              Unit
            </th>
            <th scope="col" className={cn(TH, "w-[26mm] text-right")}>
              Unit price
            </th>
            <th scope="col" className={cn(TH, "w-[30mm] text-right")}>
              Total
            </th>
          </tr>
        </thead>
        <tbody>
          {items.length === 0 ? (
            <tr className="border-line border-b">
              <td colSpan={6} className="text-small text-muted px-3 py-6 text-center">
                Items appear here as you add them.
              </td>
            </tr>
          ) : (
            items.map((item, index) => {
              const qty = parseAmount(item.quantity);
              const price = parseAmount(item.unitPrice);
              const total = lineTotal(item);
              return (
                <tr key={item.key} className="border-line text-small border-b align-top">
                  <td className={cn(TD, "text-muted tabular-nums")}>{index + 1}</td>
                  <td className={cn(TD, "text-ink font-medium")}>{item.description}</td>
                  <td className={cn(TD, "text-ink text-right tabular-nums")}>
                    {qty !== null && Number.isFinite(qty) ? formatAmount(qty) : "—"}
                  </td>
                  <td className={cn(TD, "text-ink-soft")}>{item.unit}</td>
                  <td className={cn(TD, "text-ink text-right tabular-nums")}>
                    {price !== null && Number.isFinite(price) ? formatAmount(price) : "—"}
                  </td>
                  <td className={cn(TD, "text-ink text-right font-medium tabular-nums")}>
                    {total !== null ? formatAmount(total) : "—"}
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>

      {/* Totals, right-aligned under the amount columns. */}
      {items.length > 0 && (
        <dl className="mt-2 ml-auto w-[76mm]">
          <TotalRow label="Subtotal" value={totals.subtotal} />
          {totals.discount > 0 && <TotalRow label="Discount" value={totals.discount} minus />}
          {totals.advance > 0 && <TotalRow label="Advance paid" value={totals.advance} minus />}
          <div className="border-ink mt-1 border-t" />
          <TotalRow label="Amount due" value={totals.due} strong />
        </dl>
      )}

      {/* Authorised signature only, on the left, pushed to the bottom (room above the line to
          sign) with little space below it (ADR-078). */}
      <section className="mt-auto pt-10">
        <div className="border-ink w-[70mm] border-t pt-1.5">
          <p className="text-small text-ink font-medium">Authorised signature</p>
          <p className="text-small text-muted">{business.name}</p>
        </div>
      </section>

      <SheetFooterBand website={business.website} className="mt-3" />
    </article>
  );
}
