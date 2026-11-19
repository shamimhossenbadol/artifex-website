import { describe, expect, it } from "vitest";
import {
  INVOICE_OVERFLOW_PROBLEM,
  MAX_INVOICE_ITEMS,
  formatAmount,
  invoicePrintProblems,
  invoiceProblems,
  invoiceTotals,
  lineTotal,
  parseAmount,
  roundMoney,
  type InvoiceDraft,
  type InvoiceItem,
} from "@/lib/invoice";

const item = (over: Partial<InvoiceItem> = {}): InvoiceItem => ({
  key: 1,
  description: "Mk-1 Fabrics",
  quantity: "27",
  unit: "yds",
  unitPrice: "1500",
  ...over,
});

const draft = (over: Partial<InvoiceDraft> = {}): InvoiceDraft => ({
  date: "2026-11-15",
  invoiceNumber: "",
  customerName: "Abu Kashem",
  customerPhone: "01878077889",
  customerAddress: "House 30, Road 03, Sector 03, Uttara",
  items: [item()],
  discount: "",
  advance: "",
  ...over,
});

describe("parseAmount", () => {
  it("reads whole numbers, decimals and lakh commas", () => {
    expect(parseAmount("1500")).toBe(1500);
    expect(parseAmount("2.5")).toBe(2.5);
    expect(parseAmount("1,25,000.50")).toBe(125000.5);
    expect(parseAmount(" ৳ 300 ")).toBe(300);
  });

  it("is null when empty and NaN when invalid or too large", () => {
    expect(parseAmount("")).toBeNull();
    expect(parseAmount("abc")).toBeNaN();
    expect(parseAmount("1.234")).toBeNaN();
    expect(parseAmount("-5")).toBeNaN();
    expect(parseAmount("200000000")).toBeNaN();
  });
});

describe("totals", () => {
  it("multiplies quantity by unit price per row", () => {
    expect(lineTotal(item())).toBe(40500);
    expect(lineTotal(item({ quantity: "2.5", unitPrice: "380" }))).toBe(950);
    expect(lineTotal(item({ unitPrice: "" }))).toBeNull();
    expect(roundMoney(1.005 * 1000)).toBe(1005);
  });

  it("matches the shop's sample bill: total, advance and due", () => {
    const rows: [string, string, string][] = [
      ["Mk -1 Fabrics", "27", "1500"],
      ["Hd Sheres", "42", "850"],
      ["Laice", "33", "380"],
      ["Curtain Making", "162", "80"],
      ["Reebon", "81", "30"],
      ["Eyelet", "144", "40"],
      ["Hard Paper", "162", "50"],
      ["Pelmet Making", "27", "250"],
      ["Belt Making", "6", "200"],
      ["A/B SS Pipe", "27", "280"],
      ["A/B Siling Clump", "9", "380"],
      ["A/B Andt", "5", "650"],
    ];
    const totals = invoiceTotals(
      draft({
        items: rows.map(([description, quantity, unitPrice], key) =>
          item({ key, description, quantity, unitPrice }),
        ),
        advance: "10000",
      }),
    );
    expect(totals).toEqual({ subtotal: 140170, discount: 0, advance: 10000, due: 130170 });
  });

  it("ignores blank rows and subtracts a discount", () => {
    const totals = invoiceTotals(
      draft({ items: [item(), item({ key: 2, description: " " })], discount: "500" }),
    );
    expect(totals).toMatchObject({ subtotal: 40500, discount: 500, due: 40000 });
  });
});

describe("formatAmount", () => {
  it("uses lakh grouping and shows decimals only when needed", () => {
    expect(formatAmount(140170)).toBe("1,40,170");
    expect(formatAmount(1250.5)).toBe("1,250.50");
  });
});

describe("invoiceProblems", () => {
  it("is empty for a complete invoice", () => {
    expect(invoiceProblems(draft())).toEqual([]);
  });

  it("asks for a name, an item with quantity and price, valid amounts and a date", () => {
    const problems = invoiceProblems(
      draft({
        customerName: " ",
        items: [item({ quantity: "0", unitPrice: "x" })],
        advance: "abc",
        date: "2026-02-31",
      }),
    );
    expect(problems).toEqual([
      "Add the customer's name.",
      "Every item needs a quantity above 0 (up to two decimals, e.g. 2.5).",
      "Every item needs a unit price (up to two decimals).",
      "The advance isn't a valid amount.",
      "Choose the date.",
    ]);
    expect(invoiceProblems(draft({ items: [] }))).toContain("Add at least one item.");
    expect(invoiceProblems(draft({ discount: "50000" }))).toContain(
      "The discount is more than the subtotal.",
    );
  });
});

describe("invoicePrintProblems (ADR-077)", () => {
  it("blocks printing only when the measured sheet overflows one A4 page", () => {
    const full = draft({
      items: Array.from({ length: MAX_INVOICE_ITEMS }, (_, i) => item({ key: i + 1 })),
    });
    expect(invoicePrintProblems(full, false)).toEqual([]);
    expect(invoicePrintProblems(full, true)).toEqual([INVOICE_OVERFLOW_PROBLEM]);
  });

  it("lists the form problems first, then the overflow", () => {
    expect(invoicePrintProblems(draft({ customerName: "" }), true)).toEqual([
      "Add the customer's name.",
      INVOICE_OVERFLOW_PROBLEM,
    ]);
  });
});
