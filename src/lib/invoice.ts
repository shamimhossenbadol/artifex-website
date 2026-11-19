// Invoice helpers (ADR-067). Like the delivery challan, an invoice is built and printed in the
// browser only: nothing is sent to the server or stored, so these helpers are pure and shared by
// the form, the printable sheet and the tests. Dates reuse the challan's Dhaka-calendar helpers.
export {
  challanDateInput as invoiceDateInput,
  formatChallanDate as formatInvoiceDate,
} from "./challan";
import { formatChallanDate } from "./challan";

/** Rows that fit on one A4 page with the letterhead, totals and signatures. */
export const MAX_INVOICE_ITEMS = 15;
/** Upper bound for a quantity or a money amount (keeps typos like 1500000000 out). */
export const MAX_INVOICE_AMOUNT = 100_000_000;

/** Suggestions for the unit column; any other text is allowed. */
export const INVOICE_UNITS = ["pcs", "set", "yds", "feet", "sft", "rft", "meter", "kg"] as const;

export type InvoiceItem = {
  /** Stable key for React lists (not printed). */
  key: number;
  description: string;
  quantity: string;
  unit: string;
  unitPrice: string;
};

export type InvoiceDraft = {
  date: string; // YYYY-MM-DD (Dhaka calendar day)
  invoiceNumber: string;
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  items: InvoiceItem[];
  discount: string;
  advance: string;
};

/**
 * Parses a quantity or Taka amount typed by the admin: digits with at most two decimals, commas
 * allowed ("1,25,000.50"). Empty → null; anything else (or above the cap) → NaN.
 */
export function parseAmount(value: string): number | null {
  const cleaned = value.replace(/[,\s৳]/g, "");
  if (cleaned === "") return null;
  if (!/^\d+(\.\d{1,2})?$/.test(cleaned)) return Number.NaN;
  const n = Number(cleaned);
  return n <= MAX_INVOICE_AMOUNT ? n : Number.NaN;
}

const isValid = (n: number | null): n is number => n !== null && Number.isFinite(n);

/** Rounds to paisa (2 decimals) without floating-point drift (2.675 → 2.68). */
export function roundMoney(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

/** Rows that will be printed: those with a description (blank rows are ignored). */
export function filledInvoiceItems(items: InvoiceItem[]): InvoiceItem[] {
  return items.filter((item) => item.description.trim() !== "");
}

/** Quantity × unit price, or null while either is missing or invalid. */
export function lineTotal(item: InvoiceItem): number | null {
  const qty = parseAmount(item.quantity);
  const price = parseAmount(item.unitPrice);
  return isValid(qty) && isValid(price) ? roundMoney(qty * price) : null;
}

export type InvoiceTotals = {
  subtotal: number;
  discount: number;
  advance: number;
  /** subtotal − discount − advance (can be negative if more was paid; shown as is). */
  due: number;
};

export function invoiceTotals(draft: InvoiceDraft): InvoiceTotals {
  const subtotal = roundMoney(
    filledInvoiceItems(draft.items).reduce((sum, item) => sum + (lineTotal(item) ?? 0), 0),
  );
  const discount = parseAmount(draft.discount);
  const advance = parseAmount(draft.advance);
  const d = isValid(discount) ? discount : 0;
  const a = isValid(advance) ? advance : 0;
  return { subtotal, discount: d, advance: a, due: roundMoney(subtotal - d - a) };
}

/** "1,40,170" or "1,250.50": Bangladeshi (lakh) grouping, decimals only when needed. */
export function formatAmount(n: number): string {
  return new Intl.NumberFormat("en-IN", {
    minimumFractionDigits: Number.isInteger(n) ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(n);
}

/** What's missing before the invoice can be printed (empty when it's ready). */
export function invoiceProblems(draft: InvoiceDraft): string[] {
  const problems: string[] = [];
  if (!draft.customerName.trim()) problems.push("Add the customer's name.");
  const items = filledInvoiceItems(draft.items);
  if (items.length === 0) problems.push("Add at least one item.");
  if (items.some((item) => !isValid(parseAmount(item.quantity)) || !parseAmount(item.quantity))) {
    problems.push("Every item needs a quantity above 0 (up to two decimals, e.g. 2.5).");
  }
  if (items.some((item) => !isValid(parseAmount(item.unitPrice)))) {
    problems.push("Every item needs a unit price (up to two decimals).");
  }
  if (Number.isNaN(parseAmount(draft.discount)))
    problems.push("The discount isn't a valid amount.");
  if (Number.isNaN(parseAmount(draft.advance))) problems.push("The advance isn't a valid amount.");
  const totals = invoiceTotals(draft);
  if (totals.discount > totals.subtotal) problems.push("The discount is more than the subtotal.");
  if (!formatChallanDate(draft.date)) problems.push("Choose the date.");
  return problems;
}

/** Shown when the measured sheet runs past one A4 page (ADR-077). */
export const INVOICE_OVERFLOW_PROBLEM =
  "Too much for one A4 page: remove an item or shorten long descriptions or the address.";

/**
 * Everything that blocks printing: the form problems plus the one-page check. `overflows` is the
 * sheet measured at that moment (the form measures it again when Print is clicked, ADR-077).
 */
export function invoicePrintProblems(draft: InvoiceDraft, overflows: boolean): string[] {
  return [...invoiceProblems(draft), ...(overflows ? [INVOICE_OVERFLOW_PROBLEM] : [])];
}
