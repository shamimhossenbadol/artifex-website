"use client";
// Invoice maker (07 §3.9, ADR-067), built like the delivery challan: everything lives in this
// component's memory. Nothing is sent to the server, saved, or kept in browser storage. Print
// shows only the A4 sheet (a copy portalled under <body>, see globals.css), and the form stays
// filled after printing until "Clear" (ADR-073).
import { Plus, Printer, RotateCcw, Trash2 } from "lucide-react";
import { useEffect, useId, useRef, useState, useSyncExternalStore } from "react";
import { createPortal, flushSync } from "react-dom";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import {
  INVOICE_UNITS,
  MAX_INVOICE_ITEMS,
  filledInvoiceItems,
  formatAmount,
  invoiceDateInput,
  invoicePrintProblems,
  invoiceTotals,
  lineTotal,
  nextSignaturePlacement,
  type InvoiceDraft,
  type InvoiceItem,
  type SignaturePlacement,
} from "@/lib/invoice";
import type { ChallanProductOption } from "@/server/services/challan.service";
import { sheetOverflows, type LetterheadBusiness } from "../print/Letterhead";
import { INVOICE_PREVIEW_ID, InvoiceSheet } from "./InvoiceSheet";

export const INVOICE_PRINT_ROOT_ID = "invoice-print-root";

/** Amount fields: digits, one dot and commas only. */
const amountOnly = (value: string) => value.replace(/[^\d.,]/g, "");

let nextKey = 1;
const emptyItem = (): InvoiceItem => ({
  key: nextKey++,
  description: "",
  quantity: "1",
  unit: "pcs",
  unitPrice: "",
});

function newDraft(at: Date): InvoiceDraft {
  return {
    date: invoiceDateInput(at),
    invoiceNumber: "",
    customerName: "",
    customerPhone: "",
    customerAddress: "",
    items: [emptyItem()],
    discount: "",
    advance: "",
  };
}

const subscribeNothing = () => () => {};

/** Space the bottom signature needs besides its own block: 40 px to sign above the line, 12 px
 * above the red band (InvoiceSheet). */
const BOTTOM_SIGNATURE_EXTRA = 52;

/**
 * Measures the on-screen preview (in sheet px, whatever the preview zoom): whether it runs past
 * one A4 page, the free space between the totals and the red band, and the room the signature
 * needs at the bottom of the page (ADR-077, ADR-080).
 */
function measurePreview() {
  const sheet = document.getElementById(INVOICE_PREVIEW_ID);
  if (!sheet) return null;
  const scale =
    sheet.offsetHeight > 0 ? sheet.getBoundingClientRect().height / sheet.offsetHeight : 1;
  const totals = sheet.querySelector("[data-invoice-totals]");
  const footer = sheet.querySelector("footer");
  const signature = sheet.querySelector("[data-invoice-signature]");
  const freeSpace =
    totals && footer
      ? (footer.getBoundingClientRect().top - totals.getBoundingClientRect().bottom) / scale
      : Number.POSITIVE_INFINITY;
  const signatureHeight = signature ? signature.getBoundingClientRect().height / scale : 0;
  return {
    overflows: sheetOverflows(sheet),
    freeSpace,
    bottomRoom: BOTTOM_SIGNATURE_EXTRA + signatureHeight,
  };
}

export function InvoiceMaker({
  business,
  products,
  issuedAt,
}: {
  business: LetterheadBusiness;
  products: ChallanProductOption[];
  issuedAt: string;
}) {
  const productListId = useId();
  const unitListId = useId();
  // Same starting date on the server and in the browser (from the request time).
  const [draft, setDraft] = useState<InvoiceDraft>(() => newDraft(new Date(issuedAt)));
  const [showProblems, setShowProblems] = useState(false);
  // The invoice is exactly one A4 page: the preview is measured to make sure everything fits.
  const [overflows, setOverflows] = useState(false);
  // The signature sits at the bottom of the page, or beside the totals when the items fill the
  // page (ADR-080). The ref is the value the measurements compare against.
  const [signature, setSignature] = useState<SignaturePlacement>("bottom");
  const signatureRef = useRef<SignaturePlacement>("bottom");
  const previewRef = useRef<HTMLDivElement>(null);
  const alertRef = useRef<HTMLUListElement>(null);
  const isBrowser = useSyncExternalStore(
    subscribeNothing,
    () => true,
    () => false,
  );

  // Printing keeps the form (ADR-073): reprint or adjust freely; "Clear" starts a new invoice.

  useEffect(() => {
    const container = previewRef.current;
    if (!container) return;
    const measure = () => {
      const m = measurePreview();
      if (!m) return;
      const next = nextSignaturePlacement(signatureRef.current, m);
      if (next !== signatureRef.current) {
        // The re-render changes the preview, so the observer measures again with the new layout.
        signatureRef.current = next;
        setSignature(next);
        return;
      }
      setOverflows(m.overflows);
    };
    // Text edits re-measure; so do the web fonts arriving and window resizes, which change the
    // layout without touching the DOM (ADR-077).
    const observer = new MutationObserver(measure);
    observer.observe(container, { childList: true, subtree: true, characterData: true });
    const frame = requestAnimationFrame(measure);
    let active = true;
    void document.fonts.ready.then(() => {
      if (active) measure();
    });
    window.addEventListener("resize", measure);
    return () => {
      active = false;
      observer.disconnect();
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", measure);
    };
  }, []);

  const totals = invoiceTotals(draft);
  const itemCount = filledInvoiceItems(draft.items).length;
  const problems = invoicePrintProblems(draft, overflows);
  const set = <K extends keyof InvoiceDraft>(key: K, value: InvoiceDraft[K]) =>
    setDraft((d) => ({ ...d, [key]: value }));
  const setItem = (key: number, patch: Partial<InvoiceItem>) =>
    setDraft((d) => ({
      ...d,
      items: d.items.map((item) => (item.key === key ? { ...item, ...patch } : item)),
    }));

  function print() {
    // Measure the sheet now, not the last observed state, so Print never sends a sheet that
    // doesn't fit one A4 page (ADR-077).
    let m = measurePreview();
    if (m?.overflows && signatureRef.current === "bottom") {
      // Try the signature beside the totals first (ADR-080), then measure that layout.
      flushSync(() => {
        signatureRef.current = "beside";
        setSignature("beside");
      });
      m = measurePreview();
    }
    const overflowsNow = m?.overflows ?? false;
    setOverflows(overflowsNow);
    if (invoicePrintProblems(draft, overflowsNow).length > 0) {
      setShowProblems(true);
      requestAnimationFrame(() => alertRef.current?.scrollIntoView({ block: "nearest" }));
      return;
    }
    window.print();
  }

  return (
    <div className="grid items-start gap-8 xl:grid-cols-[minmax(24rem,28rem)_1fr]">
      <form
        className="flex flex-col gap-6"
        onSubmit={(event) => {
          event.preventDefault();
          print();
        }}
      >
        <section className="admin-card flex flex-col gap-5 p-5">
          <h2 className="text-h3">Customer</h2>
          <Field label="Name">
            <Input
              value={draft.customerName}
              onChange={(e) => set("customerName", e.target.value)}
              maxLength={80}
              autoComplete="off"
            />
          </Field>
          <Field label="Phone (optional)">
            <Input
              type="tel"
              inputMode="tel"
              value={draft.customerPhone}
              onChange={(e) => set("customerPhone", e.target.value)}
              maxLength={30}
              autoComplete="off"
            />
          </Field>
          <Field label="Address (optional)">
            <Textarea
              value={draft.customerAddress}
              onChange={(e) => set("customerAddress", e.target.value)}
              rows={2}
              maxLength={240}
            />
          </Field>
        </section>

        <section className="admin-card flex flex-col gap-4 p-5">
          <div className="flex items-baseline justify-between gap-3">
            <h2 className="text-h3">Items</h2>
            <p className="text-small text-muted tabular-nums">
              {itemCount === 1 ? "1 item" : `${itemCount} items`} · ৳{" "}
              {formatAmount(totals.subtotal)}
            </p>
          </div>
          <p className="text-small text-muted -mt-2">
            Pick a product or type any item. Quantities and prices can have two decimals.
          </p>
          <datalist id={productListId}>
            {products.map((product) => (
              <option key={product.id} value={product.label} />
            ))}
          </datalist>
          <datalist id={unitListId}>
            {INVOICE_UNITS.map((unit) => (
              <option key={unit} value={unit} />
            ))}
          </datalist>
          <ol className="flex flex-col gap-4">
            {draft.items.map((item, index) => {
              const total = lineTotal(item);
              return (
                <li key={item.key} className="border-line flex flex-col gap-3 border-b pb-4">
                  <div className="flex items-end gap-2">
                    <div className="min-w-0 flex-1">
                      <Field label={`Item ${index + 1}`}>
                        <Input
                          list={productListId}
                          value={item.description}
                          onChange={(e) => setItem(item.key, { description: e.target.value })}
                          maxLength={120}
                          autoComplete="off"
                        />
                      </Field>
                    </div>
                    <button
                      type="button"
                      disabled={draft.items.length === 1}
                      onClick={() =>
                        setDraft((d) => ({
                          ...d,
                          items: d.items.filter((i) => i.key !== item.key),
                        }))
                      }
                      className="text-ink-soft hover:text-danger inline-flex size-11 shrink-0 items-center justify-center disabled:opacity-30"
                    >
                      <Trash2 aria-hidden strokeWidth={1.5} className="size-5" />
                      <span className="sr-only">Remove item {index + 1}</span>
                    </button>
                  </div>
                  <div className="grid grid-cols-[1fr_1fr_1.4fr] gap-2">
                    <Field label="Qty">
                      <Input
                        inputMode="decimal"
                        value={item.quantity}
                        onChange={(e) =>
                          setItem(item.key, { quantity: amountOnly(e.target.value) })
                        }
                        maxLength={12}
                      />
                    </Field>
                    <Field label="Unit">
                      <Input
                        list={unitListId}
                        value={item.unit}
                        onChange={(e) => setItem(item.key, { unit: e.target.value })}
                        maxLength={12}
                        autoComplete="off"
                      />
                    </Field>
                    <Field label="Unit price (৳)">
                      <Input
                        inputMode="decimal"
                        value={item.unitPrice}
                        onChange={(e) =>
                          setItem(item.key, { unitPrice: amountOnly(e.target.value) })
                        }
                        maxLength={14}
                      />
                    </Field>
                  </div>
                  <p className="text-small text-muted text-right tabular-nums">
                    Line total:{" "}
                    <span className="text-ink font-medium">
                      {total === null ? "—" : `৳ ${formatAmount(total)}`}
                    </span>
                  </p>
                </li>
              );
            })}
          </ol>
          <Button
            type="button"
            variant="secondary"
            disabled={draft.items.length >= MAX_INVOICE_ITEMS}
            onClick={() => setDraft((d) => ({ ...d, items: [...d.items, emptyItem()] }))}
          >
            <Plus aria-hidden strokeWidth={1.5} className="size-4" />
            Add item
          </Button>
          <p className="text-small text-muted">Up to {MAX_INVOICE_ITEMS} items.</p>
        </section>

        <section className="admin-card flex flex-col gap-5 p-5">
          <h2 className="text-h3">Payment</h2>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Discount (৳, optional)">
              <Input
                inputMode="decimal"
                value={draft.discount}
                onChange={(e) => set("discount", amountOnly(e.target.value))}
                maxLength={14}
              />
            </Field>
            <Field label="Advance paid (৳, optional)">
              <Input
                inputMode="decimal"
                value={draft.advance}
                onChange={(e) => set("advance", amountOnly(e.target.value))}
                maxLength={14}
              />
            </Field>
          </div>
          <dl className="bg-bg text-small flex flex-col gap-1 rounded-md px-4 py-3 tabular-nums">
            <div className="flex justify-between">
              <dt className="text-muted">Subtotal</dt>
              <dd>৳ {formatAmount(totals.subtotal)}</dd>
            </div>
            {totals.discount > 0 && (
              <div className="flex justify-between">
                <dt className="text-muted">Discount</dt>
                <dd>− ৳ {formatAmount(totals.discount)}</dd>
              </div>
            )}
            {totals.advance > 0 && (
              <div className="flex justify-between">
                <dt className="text-muted">Advance paid</dt>
                <dd>− ৳ {formatAmount(totals.advance)}</dd>
              </div>
            )}
            <div className="border-line text-ink mt-1 flex justify-between border-t pt-1 font-semibold">
              <dt>Amount due</dt>
              <dd>৳ {formatAmount(totals.due)}</dd>
            </div>
          </dl>
        </section>

        <section className="admin-card flex flex-col gap-5 p-5">
          <h2 className="text-h3">Details</h2>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Date">
              <Input type="date" value={draft.date} onChange={(e) => set("date", e.target.value)} />
            </Field>
            <Field label="Invoice no. (optional)">
              <Input
                value={draft.invoiceNumber}
                onChange={(e) => set("invoiceNumber", e.target.value)}
                maxLength={30}
                autoComplete="off"
              />
            </Field>
          </div>
        </section>

        {(showProblems || overflows) && problems.length > 0 && (
          <ul
            ref={alertRef}
            role="alert"
            className="border-danger/40 bg-danger/5 text-small text-danger flex flex-col gap-1 rounded-md border px-4 py-3"
          >
            {problems.map((problem) => (
              <li key={problem}>{problem}</li>
            ))}
          </ul>
        )}

        <div className="flex flex-wrap gap-3">
          <Button type="submit">
            <Printer aria-hidden strokeWidth={1.5} className="size-4" />
            Print invoice
          </Button>
          <Button
            type="button"
            variant="secondary"
            onClick={() => {
              setDraft(newDraft(new Date()));
              setShowProblems(false);
            }}
          >
            <RotateCcw aria-hidden strokeWidth={1.5} className="size-4" />
            Clear
          </Button>
        </div>
        <p className="text-small text-muted">
          Nothing is saved: the invoice exists only on this page. Printing keeps the form; use Clear
          to start a new one. Use “Save as PDF” in the print dialog to keep a copy.
        </p>
      </form>

      <section aria-label="Preview" className="xl:sticky xl:top-6">
        <p className="text-small text-muted mb-2">Preview: exactly one A4 page (210 × 297 mm)</p>
        <div ref={previewRef} className="border-line bg-sand overflow-auto rounded-md border p-4">
          <InvoiceSheet
            id={INVOICE_PREVIEW_ID}
            draft={draft}
            signature={signature}
            business={business}
            className="mx-auto xl:[zoom:0.72] 2xl:[zoom:0.9]"
          />
        </div>
      </section>

      {/* The print copy: a direct child of <body>, the only thing shown when printing. */}
      {isBrowser &&
        createPortal(
          <div id={INVOICE_PRINT_ROOT_ID}>
            <InvoiceSheet draft={draft} business={business} signature={signature} />
          </div>,
          document.body,
        )}
    </div>
  );
}
