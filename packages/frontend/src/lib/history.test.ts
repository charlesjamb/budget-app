import { describe, it, expect } from "vite-plus/test";
import { averageOverMonths, isOverBudget, niceCeil } from "./history.js";

describe("niceCeil", () => {
  it("rounds up to 1, 2 or 5 times a power of ten", () => {
    expect(niceCeil(0)).toBe(1);
    expect(niceCeil(320000)).toBe(500000);
    expect(niceCeil(180000)).toBe(200000);
    expect(niceCeil(500000)).toBe(500000);
    expect(niceCeil(510000)).toBe(1000000);
  });
});

describe("averageOverMonths", () => {
  it("counts months without spending as zero", () => {
    expect(
      averageOverMonths({ "2026-01": 300, "2026-03": 600 }, ["2026-01", "2026-02", "2026-03"]),
    ).toBe(300);
  });

  it("is 0 for an empty range", () => {
    expect(averageOverMonths({}, [])).toBe(0);
  });
});

describe("isOverBudget", () => {
  it("needs a positive budget that spending exceeds", () => {
    expect(isOverBudget(101, 100)).toBe(true);
    expect(isOverBudget(100, 100)).toBe(false);
    expect(isOverBudget(500, 0)).toBe(false);
    expect(isOverBudget(500, undefined)).toBe(false);
  });
});
