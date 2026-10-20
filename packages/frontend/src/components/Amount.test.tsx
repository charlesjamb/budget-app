import { describe, it, expect } from "vite-plus/test";
import { formatAmount } from "./Amount.js";

describe("formatAmount", () => {
  it("formats cents with a thousands separator and the € sign", () => {
    expect(formatAmount(160700)).toBe("1 607.00 €");
    expect(formatAmount(321100, { decimals: 0 })).toBe("3 211 €");
  });

  it("uses a typographic minus for negative amounts", () => {
    expect(formatAmount(-310)).toBe("−3.10 €");
  });

  it("adds a plus sign only when signed", () => {
    expect(formatAmount(17300, { signed: true })).toBe("+173.00 €");
    expect(formatAmount(17300)).toBe("173.00 €");
  });

  it("never shows a sign for zero", () => {
    expect(formatAmount(0, { signed: true })).toBe("0.00 €");
    expect(formatAmount(-20, { decimals: 0 })).toBe("0 €");
  });
});
