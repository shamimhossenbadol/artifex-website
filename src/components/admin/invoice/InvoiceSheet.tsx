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

const TH = "text-small px-2.5 py-2 font-semibold";
const TD = "px-2.5 py-1.5";

/** "Name ........ Abu Kashem": label left, value right, a dotted leader between. */
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
      <dd className={cn("text-ink max-w-[120mm] text-right", valueClassName)}>{children || "—"}</dd>
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
        strong ? "bg-sand text-ink py-2 font-semibold" : "py-1",
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
    <article id={id} aria-label="Invoice" className={cn(A4_SHEET_CLASS, className)}>
      <SheetWatermark />
      <SheetLetterhead business={business} />

      {/* Title with a brand-red accent; invoice number and date as labelled blocks. */}
      <div className="mt-7 flex items-end justify-between gap-6">
        <div className="min-w-0">
          <h2 className="text-h3 leading-tight">Invoice</h2>
          <div aria-hidden className="bg-brand mt-3 h-[0.7mm] w-[14mm]" />
        </div>
        <dl className="flex shrink-0 items-stretch">
          {draft.invoiceNumber.trim() && (
            <div className="pr-6 text-right">
              <dt className={SHEET_LABEL}>Invoice no.</dt>
              <dd className="text-body text-ink mt-1.5 font-semibold tabular-nums">
                {draft.invoiceNumber}
              </dd>
            </div>
          )}
          <div
            className={cn("text-right", draft.invoiceNumber.trim() && "border-line border-l pl-6")}
          >
            <dt className={SHEET_LABEL}>Date</dt>
            <dd className="text-body text-ink mt-1.5 font-semibold">{date || "—"}</dd>
          </div>
        </dl>
      </div>

      {/* Bill to */}
      <section className="border-line mt-5 border-y py-3.5">
        <p className={SHEET_LABEL}>Bill to</p>
        <dl className="mt-2.5 flex flex-col gap-1.5">
          <LeaderRow label="Customer Name" valueClassName="font-semibold">
            {draft.customerName}
          </LeaderRow>
          {draft.customerPhone.trim() && (
            <LeaderRow label="Phone Number" valueClassName="tabular-nums">
              {draft.customerPhone}
            </LeaderRow>
          )}
          {draft.customerAddress.trim() && (
            <LeaderRow label="Address" valueClassName="whitespace-pre-line">
              {draft.customerAddress}
            </LeaderRow>
          )}
        </dl>
      </section>

      {/* Items */}
      <table className="mt-5 w-full border-collapse text-left">
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
                  <td className={cn(TD, "text-ink leading-snug font-medium")}>
                    {item.description}
                  </td>
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
        <dl className="mt-3 ml-auto w-[76mm]">
          <TotalRow label="Subtotal" value={totals.subtotal} />
          {totals.discount > 0 && <TotalRow label="Discount" value={totals.discount} minus />}
          {totals.advance > 0 && <TotalRow label="Advance paid" value={totals.advance} minus />}
          <div className="border-ink mt-1 border-t" />
          <TotalRow label="Amount due" value={totals.due} strong />
        </dl>
      )}

      {/* Signatures, pushed to the bottom of the page (room above the lines to sign). */}
      <section className="mt-auto pt-12">
        <div className="grid grid-cols-2 gap-16">
          <div className="border-ink border-t pt-2">
            <p className="text-small text-ink font-medium">Customer&apos;s signature</p>
          </div>
          <div className="border-ink border-t pt-2 text-right">
            <p className="text-small text-ink font-medium">Authorised signature</p>
            <p className="text-small text-muted">{business.name}</p>
          </div>
        </div>
      </section>

      <SheetFooterBand website={business.website} />
    </article>
  );
}
