"use client";
// Invoice maker (07 §3.9, ADR-067), built like the delivery challan: everything lives in this
// component's memory. Nothing is sent to the server, saved, or kept in browser storage. Print
// shows only the A4 sheet (a copy portalled under <body>, see globals.css), and the form stays
// filled after printing until "Clear" (ADR-073).
import { ChevronDown, ChevronUp, Plus, Printer, RotateCcw, Trash2 } from "lucide-react";
import { useEffect, useId, useRef, useState, useSyncExternalStore } from "react";
import { createPortal, flushSync } from "react-dom";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import {
  ADVANCE_METHODS,
  INVOICE_TERMS,
  INVOICE_UNITS,
  advanceMethodLabel,
  MAX_INVOICE_ITEMS,
  SIGNATURE_LIFT_MAX_MM,
  SIGNATURE_LIFT_STEP_MM,
  TERMS_GAP_MAX_MM,
  formatInvoiceNumber,
  invoiceNumberInput,
  filledInvoiceItems,
  formatAmount,
  invoiceDateInput,
  invoicePrintProblems,
  invoiceTotals,
  lineTotal,
  nextSignaturePlacement,
  signatureLayout,
  type AdvanceMethod,
  type InvoiceDraft,
  type InvoiceItem,
  type SignaturePlacement,
  type SignaturePosition,
  type SignatureSide,
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
    advanceMethod: "",
    signatureSide: "left",
    signaturePosition: "auto",
    signatureLift: 0,
    termsGap: 0,
    terms: [],
  };
}

const subscribeNothing = () => () => {};

/** Space the bottom signature needs besides its own block: 40 px to sign above the line, 12 px
 * above the red band (InvoiceSheet). */
const BOTTOM_SIGNATURE_EXTRA = 52;
/** CSS px per mm (96 dpi). */
const PX_PER_MM = 96 / 25.4;

/**
 * Measures the on-screen preview (in sheet px, whatever the preview zoom): whether it runs past
 * one A4 page, the free space between the content after the items (totals, terms) and the red
 * band, the room the signature needs at the bottom of the page (with its chosen lift, ADR-082),
 * and the empty space above the bottom signature, which limits how far it can move up
 * (ADR-077, ADR-080).
 */
function measurePreview(liftMm: number) {
  const sheet = document.getElementById(INVOICE_PREVIEW_ID);
  if (!sheet) return null;
  const scale =
    sheet.offsetHeight > 0 ? sheet.getBoundingClientRect().height / sheet.offsetHeight : 1;
  const totals = sheet.querySelector("[data-invoice-totals]");
  const flowEnd = sheet.querySelector("[data-invoice-flow-end]");
  const footer = sheet.querySelector("footer");
  const signature = sheet.querySelector("[data-invoice-signature]");
  const freeSpace =
    totals && flowEnd && footer
      ? (footer.getBoundingClientRect().top - flowEnd.getBoundingClientRect().bottom) / scale
      : Number.POSITIVE_INFINITY;
  const signatureHeight = signature ? signature.getBoundingClientRect().height / scale : 0;
  // The page's empty space: above the bottom signature, or above the red band when the signature
  // sits after the totals. Moving the signature up or the terms down uses it up (ADR-082/083).
  const slot = sheet.querySelector("[data-invoice-signature-slot]");
  const below = slot ?? footer;
  const emptySpace =
    below && flowEnd
      ? (below.getBoundingClientRect().top - flowEnd.getBoundingClientRect().bottom) / scale
      : 0;
  return {
    overflows: sheetOverflows(sheet),
    freeSpace,
    bottomRoom: BOTTOM_SIGNATURE_EXTRA + signatureHeight + liftMm * PX_PER_MM,
    emptySpace,
  };
}

/**
 * "Move down · value · Move up" for nudging the signature or the terms (ADR-082, ADR-083). A
 * labelled group, so each pair of buttons is named by its label for assistive tech and tests.
 */
function MoveButtons({
  label,
  value,
  upDisabled,
  downDisabled,
  onUp,
  onDown,
}: {
  label: string;
  value: string;
  upDisabled: boolean;
  downDisabled: boolean;
  onUp: () => void;
  onDown: () => void;
}) {
  const labelId = useId();
  return (
    <div role="group" aria-labelledby={labelId} className="flex flex-col gap-2">
      <p id={labelId} className="text-small text-ink font-medium">
        {label}
      </p>
      <div className="flex items-center gap-2">
        <Button type="button" variant="secondary" disabled={downDisabled} onClick={onDown}>
          <ChevronDown aria-hidden strokeWidth={1.5} className="size-4" />
          Move down
        </Button>
        <output
          aria-live="polite"
          className="text-small text-ink min-w-20 text-center tabular-nums"
        >
          {value}
        </output>
        <Button type="button" variant="secondary" disabled={upDisabled} onClick={onUp}>
          <ChevronUp aria-hidden strokeWidth={1.5} className="size-4" />
          Move up
        </Button>
      </div>
    </div>
  );
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
  // Same starting date on the server and in the browser (from the request time).
  const [draft, setDraft] = useState<InvoiceDraft>(() => newDraft(new Date(issuedAt)));
  const [showProblems, setShowProblems] = useState(false);
  // The invoice is exactly one A4 page: the preview is measured to make sure everything fits.
  const [overflows, setOverflows] = useState(false);
  // "Auto" placement from the measurements: the signature sits at the bottom of the page, or
  // beside the totals when the items fill the page (ADR-080). The ref is the value the
  // measurements compare against. The admin can also fix the side and position (ADR-081).
  const [signature, setSignature] = useState<SignaturePlacement>("bottom");
  const signatureRef = useRef<SignaturePlacement>("bottom");
  const autoRef = useRef(true);
  const autoSignature = draft.signaturePosition === "auto" && draft.signatureSide === "left";
  // The bottom signature's lift (ADR-082), for the measurements; "Move up" is offered while there
  // is empty space above the signature.
  const liftRef = useRef(0);
  const [hasRoom, setHasRoom] = useState(true);
  useEffect(() => {
    autoRef.current = autoSignature;
    liftRef.current = draft.signatureLift;
  }, [autoSignature, draft.signatureLift]);
  const layout = signatureLayout(draft.signaturePosition, draft.signatureSide, signature);
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
      const m = measurePreview(liftRef.current);
      if (!m) return;
      setHasRoom(m.emptySpace >= SIGNATURE_LIFT_STEP_MM * PX_PER_MM);
      // A fixed side/position (ADR-081) only needs the overflow check.
      const next = autoRef.current
        ? nextSignaturePlacement(signatureRef.current, m)
        : signatureRef.current;
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
    observer.observe(container, {
      childList: true,
      subtree: true,
      characterData: true,
      // The signature lift is an inline style (ADR-082).
      attributes: true,
      attributeFilter: ["style", "class"],
    });
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
    let m = measurePreview(draft.signatureLift);
    if (m?.overflows && autoRef.current && signatureRef.current === "bottom") {
      // Try the signature beside the totals first (ADR-080), then measure that layout.
      flushSync(() => {
        signatureRef.current = "beside";
        setSignature("beside");
      });
      m = measurePreview(draft.signatureLift);
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
          <datalist id={productListId}>
            {products.map((product) => (
              <option key={product.id} value={product.label} />
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
                    {/* A fixed list of units, "pcs" by default (ADR-082). */}
                    <Field label="Unit">
                      <Select
                        value={item.unit}
                        onChange={(e) => setItem(item.key, { unit: e.target.value })}
                      >
                        {INVOICE_UNITS.map((unit) => (
                          <option key={unit} value={unit}>
                            {unit}
                          </option>
                        ))}
                      </Select>
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
          {/* Printed after "Advance paid", e.g. "Advance paid (Cash)" (ADR-081). */}
          <Field label="Advance paid by (optional)">
            <Select
              value={draft.advanceMethod}
              onChange={(e) => set("advanceMethod", e.target.value as AdvanceMethod)}
            >
              <option value="">Not stated</option>
              {ADVANCE_METHODS.map((method) => (
                <option key={method.value} value={method.value}>
                  {method.label}
                </option>
              ))}
            </Select>
          </Field>
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
                <dt className="text-muted">
                  Advance paid
                  {draft.advanceMethod && ` (${advanceMethodLabel(draft.advanceMethod)})`}
                </dt>
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
            {/* Digits only, shown and printed as 6 digits: 88 → 000088 (ADR-082). */}
            <Field label="Invoice no. (optional)">
              <Input
                inputMode="numeric"
                value={draft.invoiceNumber}
                onChange={(e) => set("invoiceNumber", invoiceNumberInput(e.target.value))}
                onBlur={() => set("invoiceNumber", formatInvoiceNumber(draft.invoiceNumber))}
                maxLength={6}
                placeholder="000001"
                autoComplete="off"
              />
            </Field>
          </div>
        </section>

        {/* Signature placement and optional terms (ADR-081). Clear keeps these choices. */}
        <section className="admin-card flex flex-col gap-5 p-5">
          <h2 className="text-h3">Signature &amp; terms</h2>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Signature side">
              <Select
                value={draft.signatureSide}
                onChange={(e) => set("signatureSide", e.target.value as SignatureSide)}
              >
                <option value="left">Left</option>
                <option value="right">Right</option>
              </Select>
            </Field>
            <Field label="Signature position">
              <Select
                value={draft.signaturePosition}
                onChange={(e) => set("signaturePosition", e.target.value as SignaturePosition)}
              >
                <option value="auto">Auto</option>
                <option value="bottom">Bottom of page</option>
                <option value="up">After the totals</option>
              </Select>
            </Field>
          </div>
          {/* Up/down for the bottom signature: adds or removes space below it, 2 mm a step. "Up"
              stops when there is no empty space left above it (ADR-082). */}
          {layout === "bottom" && (
            <MoveButtons
              label="Signature height"
              value={draft.signatureLift === 0 ? "Lowest" : `${draft.signatureLift} mm up`}
              downDisabled={draft.signatureLift <= 0}
              upDisabled={!hasRoom || draft.signatureLift >= SIGNATURE_LIFT_MAX_MM}
              onDown={() =>
                set("signatureLift", Math.max(0, draft.signatureLift - SIGNATURE_LIFT_STEP_MM))
              }
              onUp={() =>
                set(
                  "signatureLift",
                  Math.min(SIGNATURE_LIFT_MAX_MM, draft.signatureLift + SIGNATURE_LIFT_STEP_MM),
                )
              }
            />
          )}
          <fieldset className="flex flex-col gap-1">
            <legend className="text-small text-ink mb-1 font-medium">
              Terms &amp; conditions (optional)
            </legend>
            {INVOICE_TERMS.map((term) => (
              <label key={term.id} className="text-small flex min-h-11 items-start gap-2 py-2">
                <input
                  type="checkbox"
                  checked={draft.terms.includes(term.id)}
                  onChange={(e) =>
                    setDraft((d) => ({
                      ...d,
                      terms: e.target.checked
                        ? [...d.terms, term.id]
                        : d.terms.filter((id) => id !== term.id),
                    }))
                  }
                  className="accent-ink mt-0.5 size-4 shrink-0"
                />
                <span>
                  <span className="text-ink font-medium">{term.title}:</span> {term.text}
                </span>
              </label>
            ))}
          </fieldset>
          {/* Space above the terms, like the signature height: "Move down" adds 2 mm and stops
              when the page has no empty space left (ADR-083). */}
          {draft.terms.length > 0 && (
            <MoveButtons
              label="Terms position"
              value={draft.termsGap === 0 ? "Highest" : `${draft.termsGap} mm down`}
              upDisabled={draft.termsGap <= 0}
              downDisabled={!hasRoom || draft.termsGap >= TERMS_GAP_MAX_MM}
              onUp={() => set("termsGap", Math.max(0, draft.termsGap - SIGNATURE_LIFT_STEP_MM))}
              onDown={() =>
                set("termsGap", Math.min(TERMS_GAP_MAX_MM, draft.termsGap + SIGNATURE_LIFT_STEP_MM))
              }
            />
          )}
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
              // A new invoice keeps the signature and terms choices (ADR-081).
              setDraft((d) => ({
                ...newDraft(new Date()),
                signatureSide: d.signatureSide,
                signaturePosition: d.signaturePosition,
                signatureLift: d.signatureLift,
                termsGap: d.termsGap,
                terms: d.terms,
              }));
              setShowProblems(false);
            }}
          >
            <RotateCcw aria-hidden strokeWidth={1.5} className="size-4" />
            Clear
          </Button>
        </div>
      </form>

      <section aria-label="Preview" className="xl:sticky xl:top-6">
        <p className="text-small text-muted mb-2">Preview: exactly one A4 page (210 × 297 mm)</p>
        <div ref={previewRef} className="border-line bg-sand overflow-auto rounded-md border p-4">
          <InvoiceSheet
            id={INVOICE_PREVIEW_ID}
            draft={draft}
            signature={layout}
            business={business}
            className="mx-auto xl:[zoom:0.72] 2xl:[zoom:0.9]"
          />
        </div>
      </section>

      {/* The print copy: a direct child of <body>, the only thing shown when printing. */}
      {isBrowser &&
        createPortal(
          <div id={INVOICE_PRINT_ROOT_ID}>
            <InvoiceSheet draft={draft} business={business} signature={layout} />
          </div>,
          document.body,
        )}
    </div>
  );
}
