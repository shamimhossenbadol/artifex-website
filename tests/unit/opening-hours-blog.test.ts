import { describe, expect, it } from "vitest";
import { formatPostDate, parseTags, readingTimeMinutes } from "@/lib/blog";
import {
  dhakaClock,
  getOpenStatus,
  parseDays,
  toOpeningHoursSpecification,
} from "@/lib/opening-hours";

const HOURS = [
  { days: "Sat–Thu", open: "10:00", close: "21:00" },
  { days: "Fri", closed: true as const },
];

/** A UTC instant for a given Dhaka wall-clock time (Dhaka is UTC+6, no DST). */
function dhaka(iso: string): Date {
  return new Date(`${iso}+06:00`);
}

describe("parseDays", () => {
  it.each([
    ["Sat–Thu", [6, 0, 1, 2, 3, 4]],
    ["Sat-Thu", [6, 0, 1, 2, 3, 4]],
    ["Saturday to Thursday", [6, 0, 1, 2, 3, 4]],
    ["Fri", [5]],
    ["Mon, Wed", [1, 3]],
    ["Daily", [0, 1, 2, 3, 4, 5, 6]],
  ])("%s", (label, days) => {
    expect(parseDays(label)?.sort()).toEqual([...days].sort());
  });

  it.each(["Weekdays", "Holidays", "", "Mo"])("returns null for %s", (label) => {
    expect(parseDays(label)).toBeNull();
  });
});

describe("dhakaClock", () => {
  it("converts to Dhaka weekday and minutes", () => {
    // 2026-11-13 is a Friday; 23:30 UTC on the 12th is 05:30 Friday in Dhaka.
    expect(dhakaClock(new Date("2026-11-12T23:30:00Z"))).toEqual({ day: 5, minutes: 330 });
  });
});

describe("getOpenStatus", () => {
  it("is open during hours on an open day", () => {
    expect(getOpenStatus(HOURS, dhaka("2026-11-12T15:00:00"))).toEqual({
      open: true,
      label: "Open now · until 21:00",
    });
  });

  it("is closed after closing time", () => {
    expect(getOpenStatus(HOURS, dhaka("2026-11-12T21:00:00"))?.open).toBe(false);
  });

  it("is closed all day on Friday", () => {
    expect(getOpenStatus(HOURS, dhaka("2026-11-13T12:00:00"))).toEqual({
      open: false,
      label: "Closed now",
    });
  });

  it("returns null when there are no usable hours", () => {
    expect(getOpenStatus([], new Date())).toBeNull();
    expect(getOpenStatus([{ days: "Holidays", closed: true }], new Date())).toBeNull();
  });
});

describe("toOpeningHoursSpecification", () => {
  it("lists open days only", () => {
    expect(toOpeningHoursSpecification(HOURS)).toEqual([
      {
        "@type": "OpeningHoursSpecification",
        dayOfWeek: ["Saturday", "Sunday", "Monday", "Tuesday", "Wednesday", "Thursday"],
        opens: "10:00",
        closes: "21:00",
      },
    ]);
  });
});

describe("blog helpers", () => {
  it("rounds reading time up at 200 words per minute", () => {
    expect(readingTimeMinutes("word ".repeat(200))).toBe(1);
    expect(readingTimeMinutes("word ".repeat(201))).toBe(2);
    expect(readingTimeMinutes("")).toBe(1);
  });

  it("ignores Markdown syntax and image URLs", () => {
    expect(readingTimeMinutes("## Title\n\n![alt](https://x.example/a.webp) [link](https://x)")).toBe(1);
  });

  it("parses and de-duplicates tags", () => {
    expect(parseTags("Sofas, Living Room ,sofas,")).toEqual(["sofas", "living room"]);
    expect(parseTags(null)).toEqual([]);
  });

  it("formats dates in Dhaka time", () => {
    expect(formatPostDate(new Date("2026-11-12T20:00:00Z"))).toBe("13 November 2026");
  });
});
