"use client";
// Opening hours rows (07 §3.6): days, open, close, closed. Posted as JSON in one hidden field.
import { Plus, Trash2 } from "lucide-react";
import { useId, useState } from "react";
import { Input } from "@/components/ui/Input";
import type { ActionResult } from "@/lib/action-result";
import type { OpeningHoursEntry } from "@/lib/validation/settings";
import { useAdminFormState } from "../AdminForm";
import { fieldError } from "../FormMessage";

type Row = { key: number; days: string; open: string; close: string; closed: boolean };

let nextKey = 1;

function toRow(entry: OpeningHoursEntry): Row {
  return "closed" in entry
    ? { key: nextKey++, days: entry.days, open: "", close: "", closed: true }
    : { key: nextKey++, days: entry.days, open: entry.open, close: entry.close, closed: false };
}

function toEntry(row: Row): OpeningHoursEntry {
  return row.closed
    ? { days: row.days.trim(), closed: true }
    : { days: row.days.trim(), open: row.open, close: row.close };
}

export function OpeningHoursEditor({ initial }: { initial: OpeningHoursEntry[] }) {
  const [rows, setRows] = useState<Row[]>(() => initial.map(toRow));
  const { state } = useAdminFormState();
  const error = fieldError(state as ActionResult | null, "openingHours");
  const errorId = useId();

  const update = (key: number, patch: Partial<Row>) =>
    setRows((rs) => rs.map((r) => (r.key === key ? { ...r, ...patch } : r)));

  return (
    <fieldset className="flex flex-col gap-3" aria-describedby={error ? errorId : undefined}>
      <legend className="text-small text-ink-soft mb-1 font-medium">Opening hours</legend>
      <input type="hidden" name="openingHours" value={JSON.stringify(rows.map(toEntry))} />
      {rows.length === 0 && <p className="text-small text-muted">No hours shown on the site.</p>}
      <ul className="flex flex-col gap-3">
        {rows.map((row, index) => (
          <li
            key={row.key}
            className="border-line grid grid-cols-2 items-end gap-3 rounded-md border p-3 sm:grid-cols-[1fr_8rem_8rem_auto_auto]"
          >
            <label className="col-span-2 flex flex-col gap-1 sm:col-span-1">
              <span className="text-small text-muted">Days</span>
              <Input
                value={row.days}
                onChange={(e) => update(row.key, { days: e.target.value })}
                placeholder="Every day, Sat–Thu, Fri…"
                maxLength={40}
                aria-label={`Days, row ${index + 1}`}
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-small text-muted">Opens</span>
              <Input
                type="time"
                value={row.open}
                disabled={row.closed}
                onChange={(e) => update(row.key, { open: e.target.value })}
                aria-label={`Opens, row ${index + 1}`}
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-small text-muted">Closes</span>
              <Input
                type="time"
                value={row.close}
                disabled={row.closed}
                onChange={(e) => update(row.key, { close: e.target.value })}
                aria-label={`Closes, row ${index + 1}`}
              />
            </label>
            <label className="text-small flex min-h-11 items-center gap-2">
              <input
                type="checkbox"
                checked={row.closed}
                onChange={(e) => update(row.key, { closed: e.target.checked })}
                className="accent-ink size-4"
              />
              Closed
            </label>
            <button
              type="button"
              onClick={() => setRows((rs) => rs.filter((r) => r.key !== row.key))}
              className="text-muted hover:text-danger inline-flex size-11 items-center justify-center justify-self-end"
            >
              <Trash2 aria-hidden strokeWidth={1.5} className="size-5" />
              <span className="sr-only">Remove row {index + 1}</span>
            </button>
          </li>
        ))}
      </ul>
      {rows.length < 14 && (
        <button
          type="button"
          onClick={() =>
            setRows((rs) => [
              ...rs,
              { key: nextKey++, days: "", open: "10:00", close: "22:00", closed: false },
            ])
          }
          className="text-ink inline-flex min-h-11 items-center gap-2 self-start text-sm font-medium underline-offset-4 hover:underline"
        >
          <Plus aria-hidden strokeWidth={1.5} className="size-4" />
          Add a row
        </button>
      )}
      {error && (
        <p id={errorId} className="text-small text-danger" aria-live="polite">
          {error}
        </p>
      )}
    </fieldset>
  );
}
