import { describe, expect, it } from "vitest";
import { historyKey } from "../BediField";

describe("historyKey", () => {
  it("is equal for two fresh arrays with the same records, so a parent re-render does not repaint the scene", () => {
    const a = [{ date: "2026-07-05", deviation: 1.25, status: "shar_badgan_excess" }];
    const b = [{ date: new Date("2026-07-05"), deviation: 1.25, status: "shar_badgan_excess" }];
    expect(historyKey(a)).toBe(historyKey(b));
  });

  it("changes when a record changes or is added", () => {
    const base = [{ date: "2026-07-05", deviation: 1.25, status: "shar_badgan_excess" }];
    expect(historyKey([{ ...base[0], deviation: 1.2 }])).not.toBe(historyKey(base));
    expect(historyKey([...base, { date: "2026-08-09", deviation: 0.9, status: "balanced" }])).not.toBe(historyKey(base));
    expect(historyKey([])).toBe("");
  });
});
