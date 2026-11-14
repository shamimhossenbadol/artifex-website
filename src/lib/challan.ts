// Delivery challan helpers (ADR-046). A challan is built and printed in the browser only: nothing
// is sent to the server or stored anywhere, so these helpers are pure and shared by the form,
// the printable sheet and the tests.
import { BUSINESS_TIME_ZONE } from "@/lib/opening-hours";

/** As many rows (each with a note) as fit on one A4 page with the letterhead and signatures. */
export const MAX_CHALLAN_ITEMS = 10;
export const MAX_CHALLAN_QUANTITY = 999;

export type ChallanItem = {
  /** Stable key for React lists (not printed). */
  key: number;
  description: string;
  note: string;
  quantity: string;
};

export type ChallanDraft = {
  date: string; // YYYY-MM-DD (Dhaka calendar day)
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  salesmanName: string;
  items: ChallanItem[];
};

/** Business details printed in the letterhead. */
export type ChallanBusiness = {
  name: string;
  address: string;
  phones: readonly string[];
  email: string;
  website: string;
};

function dhakaParts(date: Date) {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: BUSINESS_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "00";
  return {
    year: get("year"),
    month: get("month"),
    day: get("day"),
    hour: get("hour"),
    minute: get("minute"),
  };
}

/** "2026-11-14" in Dhaka, for <input type="date">. */
export function challanDateInput(date: Date): string {
  const p = dhakaParts(date);
  return `${p.year}-${p.month}-${p.day}`;
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** "14 Nov 2026" (three-letter month) for the printed sheet; "" for an empty or invalid value. */
export function formatChallanDate(value: string): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return "";
  const [, year, month, day] = match;
  const date = new Date(Date.UTC(Number(year), Number(month) - 1, Number(day)));
  // Rejects impossible dates such as 2026-02-31 (they roll over to another month).
  if (date.getUTCMonth() !== Number(month) - 1 || date.getUTCDate() !== Number(day)) return "";
  return `${Number(day)} ${MONTHS[date.getUTCMonth()]} ${year}`;
}

export function parseQuantity(value: string): number | null {
  if (!/^\d{1,3}$/.test(value.trim())) return null;
  const n = Number(value);
  return n >= 1 && n <= MAX_CHALLAN_QUANTITY ? n : null;
}

/** Rows that will be printed: those with a description (blank rows are ignored). */
export function filledItems(items: ChallanItem[]): ChallanItem[] {
  return items.filter((item) => item.description.trim() !== "");
}

export function totalQuantity(items: ChallanItem[]): number {
  return filledItems(items).reduce((sum, item) => sum + (parseQuantity(item.quantity) ?? 0), 0);
}

/** What's missing before the challan can be printed (empty when it's ready). */
export function challanProblems(draft: ChallanDraft): string[] {
  const problems: string[] = [];
  if (!draft.customerName.trim()) problems.push("Add the customer's name.");
  if (!draft.customerPhone.trim()) problems.push("Add the customer's phone number.");
  if (!draft.customerAddress.trim()) problems.push("Add the delivery address.");
  const items = filledItems(draft.items);
  if (items.length === 0) problems.push("Add at least one item.");
  if (items.some((item) => parseQuantity(item.quantity) === null)) {
    problems.push(`Every item needs a quantity from 1 to ${MAX_CHALLAN_QUANTITY}.`);
  }
  if (!formatChallanDate(draft.date)) problems.push("Choose the date.");
  return problems;
}
