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

/** The unit choices for an item (ADR-082); new rows start with "pcs". */
export const INVOICE_UNITS = [
  "pcs",
  "set",
  "feet",
  "inch",
  "yds",
  "meter",
  "sft",
  "rft",
  "kg",
] as const;

/** Invoice numbers print as 6 digits (ADR-082). */
export const INVOICE_NUMBER_DIGITS = 6;

/** Keeps digits only, at most 6 ("INV-88" → "88"). */
export function invoiceNumberInput(value: string): string {
  return value.replace(/\D/g, "").slice(0, INVOICE_NUMBER_DIGITS);
}

/** "88" → "000088"; empty stays empty (the number is optional). */
export function formatInvoiceNumber(value: string): string {
  const digits = invoiceNumberInput(value);
  return digits ? digits.padStart(INVOICE_NUMBER_DIGITS, "0") : "";
}

/** Space below the bottom signature, in mm, set with the form's up/down buttons (ADR-082). */
export const SIGNATURE_LIFT_STEP_MM = 2;
export const SIGNATURE_LIFT_MAX_MM = 120;

export type InvoiceItem = {
  /** Stable key for React lists (not printed). */
  key: number;
  description: string;
  quantity: string;
  unit: string;
  unitPrice: string;
};

/** How the advance was paid (ADR-081); "" = not stated. */
export const ADVANCE_METHODS = [
  { value: "cash", label: "Cash" },
  { value: "card", label: "Card" },
  { value: "bank", label: "Bank" },
] as const;
export type AdvanceMethod = "" | (typeof ADVANCE_METHODS)[number]["value"];

/** Label printed after "Advance paid", e.g. "Cash"; empty when not stated. */
export function advanceMethodLabel(method: AdvanceMethod): string {
  return ADVANCE_METHODS.find((m) => m.value === method)?.label ?? "";
}

/** Where the authorised signature prints (ADR-081). */
export type SignatureSide = "left" | "right";
/**
 * "auto": at the bottom while there's room, moved up when the items fill the page (ADR-080);
 * "bottom": always at the foot of the page; "up": always right after the totals.
 */
export type SignaturePosition = "auto" | "bottom" | "up";

/**
 * The owner's standard terms (ADR-081). Each can be printed or left out; the printed ones are
 * numbered in this order. `title` is printed in bold before the text.
 */
export const INVOICE_TERMS = [
  {
    id: "advance",
    title: "Advance Payment",
    text: "A 50% advance payment is required to confirm the order.",
  },
  {
    id: "collection",
    title: "Product Collection",
    text: "Products must be collected directly from our showroom.",
  },
  {
    id: "no-return",
    title: "No Return or Exchange",
    text: "All sales are final. Returns and exchanges are not accepted.",
  },
  {
    id: "remaining",
    title: "Remaining Payment",
    text: "The remaining 50% of the total amount must be paid in full before collecting the product.",
  },
  {
    id: "delivery-labor",
    title: "Delivery & Labor Charges",
    text: "All transportation, loading, unloading, and related labor costs shall be borne entirely by the customer.",
  },
] as const;
export type InvoiceTermId = (typeof INVOICE_TERMS)[number]["id"];

/** The selected terms, in the standard order. */
export function selectedInvoiceTerms(ids: readonly InvoiceTermId[]) {
  return INVOICE_TERMS.filter((term) => ids.includes(term.id));
}

export type InvoiceDraft = {
  date: string; // YYYY-MM-DD (Dhaka calendar day)
  invoiceNumber: string;
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  items: InvoiceItem[];
  discount: string;
  advance: string;
  advanceMethod: AdvanceMethod;
  signatureSide: SignatureSide;
  signaturePosition: SignaturePosition;
  /** Extra space below the signature when it's at the bottom, in mm (0 = lowest; ADR-082). */
  signatureLift: number;
  /** Terms printed under the totals; none by default. */
  terms: InvoiceTermId[];
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

/**
 * Where the authorised signature prints (ADR-080): "bottom" of the page while there's room, or
 * "beside" the totals (on their left) when the items fill the page.
 */
export type SignaturePlacement = "bottom" | "beside";

/** Extra room required before moving back to the bottom, so the layout never flip-flops. */
const SIGNATURE_MOVE_BUFFER = 8;

/**
 * Next placement from a measurement of the preview: at the bottom, an overflow moves the
 * signature beside the totals; beside the totals, it moves back once the free space under the
 * totals (`freeSpace`, px) holds the bottom signature block (`bottomRoom`, px) with a buffer.
 */
export function nextSignaturePlacement(
  current: SignaturePlacement,
  m: { overflows: boolean; freeSpace: number; bottomRoom: number },
): SignaturePlacement {
  if (current === "bottom") return m.overflows ? "beside" : "bottom";
  if (m.overflows) return "beside";
  return m.freeSpace >= m.bottomRoom + SIGNATURE_MOVE_BUFFER ? "bottom" : "beside";
}

/**
 * The layout the sheet uses (ADR-081). "Bottom" and "Up" are fixed choices ("beside" = right
 * after the totals: on their left for a left signature, under them for a right one). "Auto"
 * follows the measurement (ADR-080) for a left signature, where moving up beside the totals saves
 * space; a right signature under the totals would save almost nothing, so Auto keeps it at the
 * bottom.
 */
export function signatureLayout(
  position: SignaturePosition,
  side: SignatureSide,
  measured: SignaturePlacement,
): SignaturePlacement {
  if (position === "bottom") return "bottom";
  if (position === "up") return "beside";
  return side === "left" ? measured : "bottom";
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
