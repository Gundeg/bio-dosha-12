import { describe, expect, it } from "vitest";
import { formatDate } from "../formatDate";

// 2026-10-23 03:00 UTC = 2026-10-23 11:00 in Ulaanbaatar
const DATE = "2026-10-23T03:00:00.000Z";

describe("formatDate", () => {
  it("formats Mongolian dates from numeric parts (no dependence on runtime locale data)", () => {
    expect(formatDate(DATE, "mn")).toBe("2026.10.23");
    expect(formatDate(DATE, "mn", "monthDay")).toBe("10-р сарын 23");
    expect(formatDate(DATE, "mn", "month")).toBe("10-р сар");
    expect(formatDate(DATE, "mn", "long")).toBe("2026 оны 10-р сарын 23");
  });

  it("formats English dates in British order", () => {
    expect(formatDate(DATE, "en")).toBe("23/10/2026");
    expect(formatDate(DATE, "en", "monthDay")).toBe("23 Oct");
    expect(formatDate(DATE, "en", "monthDayLong")).toBe("23 October");
    expect(formatDate(DATE, "en", "long")).toBe("23 October 2026");
  });

  it("uses the clinic's time zone so server and browser agree on the day", () => {
    // 20:00 UTC on the 22nd is already 04:00 on the 23rd in Ulaanbaatar
    expect(formatDate("2026-10-22T20:00:00.000Z", "mn")).toBe("2026.10.23");
  });

  it("returns a dash for invalid input", () => {
    expect(formatDate("not a date", "mn")).toBe("—");
  });
});
