import { describe, it, expect } from "vite-plus/test";
import { getMonthRhythm } from "./rhythm.js";

describe("getMonthRhythm", () => {
  it("plans the current month and closes the previous one during the first week", () => {
    expect(getMonthRhythm(new Date(2026, 10, 3))).toEqual({
      planMonth: "2026-11",
      closeMonth: "2026-10",
      planEmphasised: true,
    });
  });

  it("still emphasises planning on day 7", () => {
    expect(getMonthRhythm(new Date(2026, 10, 7)).planEmphasised).toBe(true);
  });

  it("closes the current month and looks ahead after the first week", () => {
    expect(getMonthRhythm(new Date(2026, 9, 20))).toEqual({
      planMonth: "2026-11",
      closeMonth: "2026-10",
      planEmphasised: false,
    });
  });

  it("rolls over the year boundary", () => {
    expect(getMonthRhythm(new Date(2026, 0, 2)).closeMonth).toBe("2025-12");
    expect(getMonthRhythm(new Date(2026, 11, 20)).planMonth).toBe("2027-01");
  });
});
