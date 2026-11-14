// Delivery challan helpers (ADR-046): dates, quantities and the "ready to print" checks.
import { describe, expect, it } from "vitest";
import {
  challanDateInput,
  challanProblems,
  filledItems,
  formatChallanDate,
  parseQuantity,
  totalQuantity,
  type ChallanDraft,
  type ChallanItem,
} from "@/lib/challan";

const item = (description: string, quantity = "1", note = ""): ChallanItem => ({
  key: Math.random(),
  description,
  quantity,
  note,
});

const ready: ChallanDraft = {
  date: "2026-11-14",
  customerName: "Rahim Uddin",
  customerPhone: "01711-223344",
  customerAddress: "House 12, Uttara",
  salesmanName: "Karim",
  items: [item("Signature L-Shape Sofa", "1"), item("Dining chair", "6")],
};

describe("challan dates", () => {
  it("uses the Dhaka calendar day", () => {
    // 21:32 UTC on 13 Nov is 03:32 on 14 Nov in Dhaka.
    expect(challanDateInput(new Date("2026-11-13T21:32:00Z"))).toBe("2026-11-14");
  });

  it("formats the printed date and rejects bad input", () => {
    expect(formatChallanDate("2026-11-14")).toBe("14 Nov 2026");
    expect(formatChallanDate("2026-09-05")).toBe("5 Sep 2026");
    expect(formatChallanDate("2026-02-31")).toBe("");
    expect(formatChallanDate("")).toBe("");
    expect(formatChallanDate("14/11/2026")).toBe("");
  });
});

describe("items", () => {
  it("parses quantities from 1 to 999", () => {
    expect(parseQuantity("1")).toBe(1);
    expect(parseQuantity("999")).toBe(999);
    for (const bad of ["0", "1000", "", "2.5", "-1", "abc"]) expect(parseQuantity(bad)).toBeNull();
  });

  it("ignores blank rows and totals the quantities", () => {
    const items = [item("Sofa", "2"), item("   ", "5"), item("Chair", "6")];
    expect(filledItems(items)).toHaveLength(2);
    expect(totalQuantity(items)).toBe(8);
  });
});

describe("ready to print", () => {
  it("has no problems when everything is filled in", () => {
    expect(challanProblems(ready)).toEqual([]);
  });

  it("lists what's missing", () => {
    const problems = challanProblems({
      ...ready,
      customerName: " ",
      customerAddress: "",
      items: [item("Sofa", "0")],
      date: "",
    });
    expect(problems).toEqual([
      "Add the customer's name.",
      "Add the delivery address.",
      "Every item needs a quantity from 1 to 999.",
      "Choose the date.",
    ]);
    expect(challanProblems({ ...ready, items: [item("")] })).toContain("Add at least one item.");
  });
});
