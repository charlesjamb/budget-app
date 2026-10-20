import { describe, it, expect } from "vite-plus/test";
import { getRowDelta, parseAmountToCents } from "./budget-plan.js";

describe("parseAmountToCents", () => {
  it("parses dot and comma decimals", () => {
    expect(parseAmountToCents("12.5")).toBe(1250);
    expect(parseAmountToCents("12,50")).toBe(1250);
  });

  it("treats empty, invalid and negative input as 0", () => {
    expect(parseAmountToCents("")).toBe(0);
    expect(parseAmountToCents("abc")).toBe(0);
    expect(parseAmountToCents("-5")).toBe(0);
  });
});

describe("getRowDelta", () => {
  it("detects unchanged, new, up and down", () => {
    expect(getRowDelta(500, 500)).toEqual({ kind: "same" });
    expect(getRowDelta(5000, 0)).toEqual({ kind: "new" });
    expect(getRowDelta(7500, 5200)).toEqual({ kind: "up", cents: 2300 });
    expect(getRowDelta(15000, 20000)).toEqual({ kind: "down", cents: 5000 });
  });

  it("is same when both are 0 and down when cleared", () => {
    expect(getRowDelta(0, 0)).toEqual({ kind: "same" });
    expect(getRowDelta(0, 1000)).toEqual({ kind: "down", cents: 1000 });
  });
});
