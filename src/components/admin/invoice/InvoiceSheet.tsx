// The printable invoice (ADR-067): the same letterhead and watermark as the delivery challan
// (print/Letterhead.tsx), then the customer, an itemised table (qty × unit price), the totals
// (subtotal, optional discount and advance with how it was paid, due), optional terms and the
// authorised signature, and a red website band. Exactly one A4 page for both the on-screen
// preview and the print copy; it renders the form and keeps nothing. The form decides where the
// signature goes (ADR-080, ADR-081). Every right-aligned value ends exactly on the right margin.
import {
  advanceMethodLabel,
  filledInvoiceItems,
  formatAmount,
  formatInvoiceDate,
  invoiceTotals,
  lineTotal,
  parseAmount,
  selectedInvoiceTerms,
  type InvoiceDraft,
  type SignaturePlacement,
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

// Compact rows (ADR-077). The first and last columns have no outer padding, so SL starts on the
// left margin and the totals end on the right margin, like the rest of the sheet (ADR-081).
const TH = "text-small px-2.5 py-1.5 font-semibold first:pl-0 last:pr-0";
const TD = "px-2.5 py-1 leading-tight first:pl-0 last:pr-0";

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
      <span aria-hidden className="border-muted min-w-[6mm] flex-1 border-b border-dotted" />
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
        "flex items-baseline justify-between gap-6",
        strong ? "border-ink text-ink border-b py-1.5 font-semibold" : "py-0.5",
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
  signature = "bottom",
}: {
  draft: InvoiceDraft;
  business: LetterheadBusiness;
  id?: string;
  className?: string;
  /** "bottom" of the page, or "beside" = right after the totals (ADR-080, ADR-081). */
  signature?: SignaturePlacement;
}) {
  const items = filledInvoiceItems(draft.items);
  const totals = invoiceTotals(draft);
  const date = formatInvoiceDate(draft.date);
  const terms = selectedInvoiceTerms(draft.terms);
  const right = draft.signatureSide === "right";
  // "Beside" needs the totals: without items the signature stays at the bottom.
  const up = signature === "beside" && items.length > 0;
  const advanceMethod = advanceMethodLabel(draft.advanceMethod);
  const signatureBlock = (
    <div
      data-invoice-signature
      className={cn("border-ink w-[70mm] shrink-0 border-t pt-1.5", right && "text-right")}
    >
      <p className="text-small text-ink font-medium">Authorised signature</p>
      <p className="text-small text-muted">{business.name}</p>
    </div>
  );

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

      {/* Customer: no heading and no rule under it (ADR-078). Name and phone share a line; the
          phone column is as wide as the number, so it never runs past the margin (ADR-081). */}
      <section className="border-line mt-3 border-t pt-3">
        <dl className="grid grid-cols-[minmax(0,1fr)_auto] gap-x-8 gap-y-1.5">
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

      {/* Items: the header is ruled above and below (no fill), so the columns can run margin to
          margin (ADR-081). */}
      <table className="mt-3 w-full border-collapse text-left">
        <thead>
          <tr className="border-ink text-ink border-y">
            <th scope="col" className={cn(TH, "w-[9mm]")}>
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
            <th scope="col" className={cn(TH, "w-[28mm] text-right")}>
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

      {/* Everything after the items that stays in the flow; the form measures where it ends. */}
      <div data-invoice-flow-end className={cn(up && "pb-3")}>
        {/* Totals, right-aligned, ending on the margin. A left signature "up" sits beside them,
            its line level with Amount due; a right one goes under them (ADR-080, ADR-081). */}
        {items.length > 0 && (
          <div className="mt-2 flex items-end justify-between gap-8">
            {up && !right && signatureBlock}
            <dl data-invoice-totals className="ml-auto w-[76mm]">
              <TotalRow label="Subtotal" value={totals.subtotal} />
              {totals.discount > 0 && <TotalRow label="Discount" value={totals.discount} minus />}
              {totals.advance > 0 && (
                <TotalRow
                  label={advanceMethod ? `Advance paid (${advanceMethod})` : "Advance paid"}
                  value={totals.advance}
                  minus
                />
              )}
              <div className="border-ink mt-1 border-t" />
              <TotalRow label="Amount due" value={totals.due} strong />
            </dl>
          </div>
        )}
        {up && right && <div className="mt-10 flex justify-end">{signatureBlock}</div>}

        {/* Optional terms (ADR-081): only the ones ticked in the form, numbered. */}
        {terms.length > 0 && (
          <section className="mt-4">
            <h3 className={cn(SHEET_LABEL, "text-ink")}>Terms &amp; Conditions</h3>
            <ol className="text-small text-ink-soft mt-1.5 flex list-decimal flex-col gap-0.5 pl-4">
              {terms.map((term) => (
                <li key={term.id} className="leading-snug">
                  <span className="text-ink font-medium">{term.title}:</span> {term.text}
                </li>
              ))}
            </ol>
          </section>
        )}
      </div>

      {/* At the bottom: room above the line to sign, little space below it (ADR-078). */}
      {!up && (
        <section className={cn("mt-auto flex pt-10", right && "justify-end")}>
          {signatureBlock}
        </section>
      )}

      {/* The red band sits 6 mm above the paper's edge, clear of the strip most printers can't
          print, so the whole band prints and the text is centred in it (ADR-081). */}
      <SheetFooterBand
        website={business.website}
        label="Visit our website:"
        className={cn(
          "-mb-[6mm] flex h-[11mm] items-center justify-center py-0",
          up ? "mt-auto" : "mt-3",
        )}
      />
    </article>
  );
}
