"use client";
// Repeatable rows for colours and specifications (07 §3.2): add, edit, reorder, remove. The rows
// are sent as JSON in one hidden input and validated on the server (lib/validation/product).
import { ArrowDown, ArrowUp, Plus, X } from "lucide-react";
import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import type { ActionResult } from "@/lib/action-result";
import { specPresetsFor } from "@/lib/spec-presets";
import { useAdminFormState } from "../AdminForm";
import { fieldError } from "../FormMessage";

type Row = { key: number; a: string; b: string };

type RowsEditorProps = {
  /** The hidden input's name and the field-error prefix: "colors" or "specs". */
  name: "colors" | "specs";
  initial: { a: string; b: string }[];
  max: number;
  addLabel: string;
  empty: string;
};

let nextKey = 1;
const withKeys = (rows: { a: string; b: string }[]): Row[] =>
  rows.map((r) => ({ ...r, key: nextKey++ }));

const ICON_BUTTON =
  "text-ink-soft hover:text-ink inline-flex size-11 shrink-0 items-center justify-center disabled:opacity-30";

function useRows(initial: { a: string; b: string }[]) {
  const [rows, setRows] = useState(() => withKeys(initial));
  const { markDirty } = useAdminFormState();
  const update = (next: Row[]) => {
    setRows(next);
    markDirty();
  };
  return {
    rows,
    add: (a = "", b = "") => update([...rows, { key: nextKey++, a, b }]),
    change: (key: number, patch: Partial<Row>) =>
      setRows(rows.map((r) => (r.key === key ? { ...r, ...patch } : r))),
    remove: (key: number) => update(rows.filter((r) => r.key !== key)),
    move: (index: number, delta: -1 | 1) => {
      const next = [...rows];
      const target = index + delta;
      if (target < 0 || target >= next.length) return;
      [next[index], next[target]] = [next[target]!, next[index]!];
      update(next);
    },
  };
}

function RowErrors({ name, index }: { name: string; index: number }) {
  const { state } = useAdminFormState();
  const s = state as ActionResult | null;
  const messages = [
    fieldError(s, `${name}.${index}.name`),
    fieldError(s, `${name}.${index}.hex`),
    fieldError(s, `${name}.${index}.label`),
    fieldError(s, `${name}.${index}.value`),
  ].filter(Boolean);
  if (messages.length === 0) return null;
  return (
    <p className="text-small text-danger" aria-live="polite">
      {messages.join(" · ")}
    </p>
  );
}

function ListError({ name }: { name: string }) {
  const { state } = useAdminFormState();
  const message = fieldError(state as ActionResult | null, name);
  return message ? (
    <p className="text-small text-danger" aria-live="polite">
      {message}
    </p>
  ) : null;
}

function MoveButtons({
  index,
  count,
  label,
  onMove,
}: {
  index: number;
  count: number;
  label: string;
  onMove: (delta: -1 | 1) => void;
}) {
  return (
    <>
      <button
        type="button"
        disabled={index === 0}
        onClick={() => onMove(-1)}
        className={ICON_BUTTON}
      >
        <ArrowUp aria-hidden strokeWidth={1.5} className="size-4" />
        <span className="sr-only">Move {label} up</span>
      </button>
      <button
        type="button"
        disabled={index === count - 1}
        onClick={() => onMove(1)}
        className={ICON_BUTTON}
      >
        <ArrowDown aria-hidden strokeWidth={1.5} className="size-4" />
        <span className="sr-only">Move {label} down</span>
      </button>
    </>
  );
}

/** Colours: name + colour picker (with the hex shown and editable). */
export function ColorsEditor({
  initial,
  max,
}: {
  initial: { name: string; hex: string }[];
  max: number;
}) {
  const { rows, add, change, remove, move } = useRows(
    initial.map((c) => ({ a: c.name, b: c.hex })),
  );
  const value = JSON.stringify(rows.map((r) => ({ name: r.a, hex: r.b })));
  return (
    <RowsShell
      name="colors"
      value={value}
      count={rows.length}
      max={max}
      addLabel="Add colour"
      empty="No colours. Add the finishes or fabrics a customer can choose."
      onAdd={() => add("", "#8B6B4A")}
    >
      {rows.map((row, index) => {
        const label = row.a ? `colour “${row.a}”` : `colour ${index + 1}`;
        return (
          <li key={row.key} className="flex flex-col gap-1">
            <div className="flex flex-wrap items-center gap-2">
              <input
                type="color"
                value={/^#[0-9a-fA-F]{6}$/.test(row.b) ? row.b : "#000000"}
                onChange={(e) => change(row.key, { b: e.target.value.toUpperCase() })}
                aria-label={`Pick ${label}`}
                className="border-line h-11 w-12 shrink-0 cursor-pointer rounded-md border bg-transparent p-1"
              />
              <Input
                value={row.a}
                onChange={(e) => change(row.key, { a: e.target.value })}
                placeholder="Walnut Brown"
                maxLength={50}
                aria-label={`Name of ${label}`}
                className="min-w-0 flex-1 basis-40"
              />
              <Input
                value={row.b}
                onChange={(e) => change(row.key, { b: e.target.value })}
                maxLength={7}
                aria-label={`Hex code of ${label}`}
                className="w-28 font-mono uppercase"
              />
              <div className="flex">
                <MoveButtons
                  index={index}
                  count={rows.length}
                  label={label}
                  onMove={(d) => move(index, d)}
                />
                <button type="button" onClick={() => remove(row.key)} className={ICON_BUTTON}>
                  <X aria-hidden strokeWidth={1.5} className="size-4" />
                  <span className="sr-only">Remove {label}</span>
                </button>
              </div>
            </div>
            <RowErrors name="colors" index={index} />
          </li>
        );
      })}
    </RowsShell>
  );
}

/** Specifications: label + value, with quick-add labels for the selected category. */
export function SpecsEditor({
  initial,
  max,
  categories,
}: {
  initial: { label: string; value: string }[];
  max: number;
  /** id → slug, to pick presets for the category chosen in the form. */
  categories: { id: number; slug: string }[];
}) {
  const { rows, add, change, remove, move } = useRows(
    initial.map((s) => ({ a: s.label, b: s.value })),
  );
  const value = JSON.stringify(rows.map((r) => ({ label: r.a, value: r.b })));
  const anchor = useRef<HTMLDivElement>(null);
  const [categoryId, setCategoryId] = useState<string>("");

  // Follow the form's category <select> so presets match the chosen category.
  useEffect(() => {
    const select = anchor.current
      ?.closest("form")
      ?.elements.namedItem("categoryId") as HTMLSelectElement | null;
    if (!select) return;
    const sync = () => setCategoryId(select.value);
    sync();
    select.addEventListener("change", sync);
    return () => select.removeEventListener("change", sync);
  }, []);

  const slug = categories.find((c) => String(c.id) === categoryId)?.slug;
  const used = new Set(rows.map((r) => r.a.trim().toLowerCase()));
  const presets = specPresetsFor(slug).filter((p) => !used.has(p.toLowerCase()));

  return (
    <div ref={anchor} className="flex flex-col gap-4">
      {presets.length > 0 && rows.length < max && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-small text-muted">Quick add:</span>
          {presets.map((label) => (
            <button
              key={label}
              type="button"
              onClick={() => add(label, "")}
              className="border-line text-small text-ink-soft hover:border-ink hover:text-ink inline-flex min-h-9 items-center gap-1 rounded-full border px-3"
            >
              <Plus aria-hidden strokeWidth={1.5} className="size-3.5" />
              {label}
            </button>
          ))}
        </div>
      )}
      <RowsShell
        name="specs"
        value={value}
        count={rows.length}
        max={max}
        addLabel="Add specification"
        empty="No specifications yet."
        onAdd={() => add()}
      >
        {rows.map((row, index) => {
          const label = row.a ? `“${row.a}”` : `specification ${index + 1}`;
          return (
            <li key={row.key} className="flex flex-col gap-1">
              <div className="flex flex-wrap items-center gap-2">
                <Input
                  value={row.a}
                  onChange={(e) => change(row.key, { a: e.target.value })}
                  placeholder="Frame"
                  maxLength={60}
                  aria-label={`Label of ${label}`}
                  className="min-w-0 flex-1 basis-32"
                />
                <Input
                  value={row.b}
                  onChange={(e) => change(row.key, { b: e.target.value })}
                  placeholder="Solid mahogany"
                  maxLength={255}
                  aria-label={`Value of ${label}`}
                  className="min-w-0 flex-[2] basis-48"
                />
                <div className="flex">
                  <MoveButtons
                    index={index}
                    count={rows.length}
                    label={label}
                    onMove={(d) => move(index, d)}
                  />
                  <button type="button" onClick={() => remove(row.key)} className={ICON_BUTTON}>
                    <X aria-hidden strokeWidth={1.5} className="size-4" />
                    <span className="sr-only">Remove {label}</span>
                  </button>
                </div>
              </div>
              <RowErrors name="specs" index={index} />
            </li>
          );
        })}
      </RowsShell>
    </div>
  );
}

function RowsShell({
  name,
  value,
  count,
  max,
  addLabel,
  empty,
  onAdd,
  children,
}: Omit<RowsEditorProps, "initial"> & {
  value: string;
  count: number;
  onAdd: () => void;
  children: ReactNode;
}) {
  const listId = useId();
  return (
    <div className="flex flex-col gap-3">
      <input type="hidden" name={name} value={value} />
      {count === 0 ? (
        <p className="text-small text-muted">{empty}</p>
      ) : (
        <ol id={listId} className="flex flex-col gap-3">
          {children}
        </ol>
      )}
      <ListError name={name} />
      <div>
        <Button type="button" variant="secondary" disabled={count >= max} onClick={onAdd}>
          <Plus aria-hidden strokeWidth={1.5} className="size-4" />
          {addLabel}
        </Button>
        {count >= max && <span className="text-small text-muted ml-3">Up to {max}.</span>}
      </div>
    </div>
  );
}
