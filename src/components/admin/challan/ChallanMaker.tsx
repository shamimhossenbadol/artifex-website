"use client";
// Delivery challan maker (07 §3.8, ADR-046). Everything lives in this component's memory: nothing
// is sent to the server, saved, or kept in browser storage. Print shows only the A4 sheet (a copy
// portalled under <body>, see globals.css), and the form clears itself after printing.
import { Plus, Printer, RotateCcw, Trash2 } from "lucide-react";
import { useEffect, useId, useRef, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import {
  MAX_CHALLAN_ITEMS,
  MAX_CHALLAN_QUANTITY,
  challanDateInput,
  challanProblems,
  filledItems,
  totalQuantity,
  type ChallanBusiness,
  type ChallanDraft,
  type ChallanItem,
} from "@/lib/challan";
import type { ChallanProductOption } from "@/server/services/challan.service";
import { CHALLAN_PREVIEW_ID, ChallanSheet, sheetOverflows } from "./ChallanSheet";

export const CHALLAN_PRINT_ROOT_ID = "challan-print-root";

let nextKey = 1;
const emptyItem = (): ChallanItem => ({
  key: nextKey++,
  description: "",
  note: "",
  quantity: "1",
});

function newDraft(at: Date): ChallanDraft {
  return {
    date: challanDateInput(at),
    customerName: "",
    customerPhone: "",
    customerAddress: "",
    salesmanName: "",
    items: [emptyItem()],
  };
}

const subscribeNothing = () => () => {};

export function ChallanMaker({
  business,
  products,
  issuedAt,
}: {
  business: ChallanBusiness;
  products: ChallanProductOption[];
  issuedAt: string;
}) {
  const listId = useId();
  // Same starting date on the server and in the browser (from the request time).
  const [draft, setDraft] = useState<ChallanDraft>(() => newDraft(new Date(issuedAt)));
  const [showProblems, setShowProblems] = useState(false);
  // The challan is exactly one A4 page: the preview is measured to make sure everything fits.
  const [overflows, setOverflows] = useState(false);
  const previewRef = useRef<HTMLDivElement>(null);
  const isBrowser = useSyncExternalStore(
    subscribeNothing,
    () => true,
    () => false,
  );

  // "Print and vanish": once the print dialog closes, start a fresh challan.
  useEffect(() => {
    const reset = () => {
      setDraft(newDraft(new Date()));
      setShowProblems(false);
    };
    window.addEventListener("afterprint", reset);
    return () => window.removeEventListener("afterprint", reset);
  }, []);

  useEffect(() => {
    const container = previewRef.current;
    if (!container) return;
    const measure = () => setOverflows(sheetOverflows(document.getElementById(CHALLAN_PREVIEW_ID)));
    const observer = new MutationObserver(measure);
    observer.observe(container, { childList: true, subtree: true, characterData: true });
    const frame = requestAnimationFrame(measure);
    return () => {
      observer.disconnect();
      cancelAnimationFrame(frame);
    };
  }, []);

  const problems = [
    ...challanProblems(draft),
    ...(overflows
      ? ["Too much for one A4 page: remove an item or shorten the address or item notes."]
      : []),
  ];
  const set = <K extends keyof ChallanDraft>(key: K, value: ChallanDraft[K]) =>
    setDraft((d) => ({ ...d, [key]: value }));
  const setItem = (key: number, patch: Partial<ChallanItem>) =>
    setDraft((d) => ({
      ...d,
      items: d.items.map((item) => (item.key === key ? { ...item, ...patch } : item)),
    }));

  function print() {
    if (problems.length > 0) {
      setShowProblems(true);
      return;
    }
    window.print();
  }

  return (
    <div className="grid items-start gap-8 xl:grid-cols-[minmax(22rem,26rem)_1fr]">
      <form
        className="flex flex-col gap-6"
        onSubmit={(event) => {
          event.preventDefault();
          print();
        }}
      >
        <section className="border-line bg-surface flex flex-col gap-5 rounded-md border p-5">
          <h2 className="text-h3">Customer</h2>
          <Field label="Name">
            <Input
              value={draft.customerName}
              onChange={(e) => set("customerName", e.target.value)}
              maxLength={80}
              autoComplete="off"
            />
          </Field>
          <Field label="Phone">
            <Input
              type="tel"
              inputMode="tel"
              value={draft.customerPhone}
              onChange={(e) => set("customerPhone", e.target.value)}
              maxLength={30}
              autoComplete="off"
            />
          </Field>
          <Field label="Delivery address">
            <Textarea
              value={draft.customerAddress}
              onChange={(e) => set("customerAddress", e.target.value)}
              rows={2}
              maxLength={240}
            />
          </Field>
        </section>

        <section className="border-line bg-surface flex flex-col gap-4 rounded-md border p-5">
          <div className="flex items-baseline justify-between gap-3">
            <h2 className="text-h3">Items</h2>
            <p className="text-small text-muted tabular-nums">
              {filledItems(draft.items).length === 1
                ? "1 item"
                : `${filledItems(draft.items).length} items`}{" "}
              · {totalQuantity(draft.items)} pcs
            </p>
          </div>
          <p className="text-small text-muted -mt-2">
            Start typing to pick a product, or type any item.
          </p>
          <datalist id={listId}>
            {products.map((product) => (
              <option key={product.id} value={product.label} />
            ))}
          </datalist>
          <ol className="flex flex-col gap-4">
            {draft.items.map((item, index) => (
              <li key={item.key} className="border-line flex flex-col gap-3 border-b pb-4">
                <div className="flex items-end gap-2">
                  <div className="min-w-0 flex-1">
                    <Field label={`Item ${index + 1}`}>
                      <Input
                        list={listId}
                        value={item.description}
                        onChange={(e) => setItem(item.key, { description: e.target.value })}
                        maxLength={120}
                        autoComplete="off"
                      />
                    </Field>
                  </div>
                  <div className="w-20 shrink-0">
                    <Field label="Qty">
                      <Input
                        inputMode="numeric"
                        value={item.quantity}
                        onChange={(e) =>
                          setItem(item.key, { quantity: e.target.value.replace(/\D/g, "") })
                        }
                        maxLength={3}
                      />
                    </Field>
                  </div>
                </div>
                <div className="flex items-end gap-2">
                  <div className="min-w-0 flex-1">
                    <Field label="Note (optional)">
                      <Input
                        value={item.note}
                        onChange={(e) => setItem(item.key, { note: e.target.value })}
                        maxLength={120}
                        placeholder="Colour, size or finish"
                        autoComplete="off"
                      />
                    </Field>
                  </div>
                  <button
                    type="button"
                    disabled={draft.items.length === 1}
                    onClick={() =>
                      setDraft((d) => ({ ...d, items: d.items.filter((i) => i.key !== item.key) }))
                    }
                    className="text-ink-soft hover:text-danger inline-flex size-11 shrink-0 items-center justify-center disabled:opacity-30"
                  >
                    <Trash2 aria-hidden strokeWidth={1.5} className="size-5" />
                    <span className="sr-only">Remove item {index + 1}</span>
                  </button>
                </div>
              </li>
            ))}
          </ol>
          <Button
            type="button"
            variant="secondary"
            disabled={draft.items.length >= MAX_CHALLAN_ITEMS}
            onClick={() => setDraft((d) => ({ ...d, items: [...d.items, emptyItem()] }))}
          >
            <Plus aria-hidden strokeWidth={1.5} className="size-4" />
            Add item
          </Button>
          <p className="text-small text-muted">
            Up to {MAX_CHALLAN_ITEMS} items, quantities 1–{MAX_CHALLAN_QUANTITY}.
          </p>
        </section>

        <section className="border-line bg-surface flex flex-col gap-5 rounded-md border p-5">
          <h2 className="text-h3">Details</h2>
          <Field label="Date">
            <Input type="date" value={draft.date} onChange={(e) => set("date", e.target.value)} />
          </Field>
          <Field
            label="Salesman"
            hint="Printed beside the title and under the salesman's signature."
          >
            <Input
              value={draft.salesmanName}
              onChange={(e) => set("salesmanName", e.target.value)}
              maxLength={60}
              autoComplete="off"
            />
          </Field>
        </section>

        {(showProblems || overflows) && problems.length > 0 && (
          <ul
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
            Print challan
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
          Nothing is saved: the challan exists only on this page and clears after printing.
        </p>
      </form>

      <section aria-label="Preview" className="xl:sticky xl:top-6">
        <p className="text-small text-muted mb-2">Preview: exactly one A4 page (210 × 297 mm)</p>
        <div ref={previewRef} className="border-line bg-sand overflow-auto rounded-md border p-4">
          <ChallanSheet
            id={CHALLAN_PREVIEW_ID}
            draft={draft}
            business={business}
            className="mx-auto xl:[zoom:0.72] 2xl:[zoom:0.9]"
          />
        </div>
      </section>

      {/* The print copy: a direct child of <body>, the only thing shown when printing. */}
      {isBrowser &&
        createPortal(
          <div id={CHALLAN_PRINT_ROOT_ID}>
            <ChallanSheet draft={draft} business={business} />
          </div>,
          document.body,
        )}
    </div>
  );
}
