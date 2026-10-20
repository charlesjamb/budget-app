import { describe, it, expect } from "vite-plus/test";
import { computeShares } from "./split.js";

describe("computeShares", () => {
  it("splits proportionally to the weights", () => {
    expect(computeShares(120000, [420000, 229000])).toEqual([77658, 42342]);
  });

  it("assigns the rounding remainder so shares sum exactly to the total", () => {
    const shares = computeShares(100, [1, 1, 1]);
    expect(shares).toEqual([33, 33, 34]);
    expect(shares.reduce((a, b) => a + b, 0)).toBe(100);
  });

  it("sums exactly for negative totals too", () => {
    const shares = computeShares(-100, [1, 1, 1]);
    expect(shares.reduce((a, b) => a + b, 0)).toBe(-100);
  });

  it("never gives the remainder to a member without revenue", () => {
    expect(computeShares(101, [1, 1, 0])).toEqual([51, 50, 0]);
  });

  it("returns zeros when nobody has revenue", () => {
    expect(computeShares(5000, [0, 0])).toEqual([0, 0]);
  });
});
