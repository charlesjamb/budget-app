import { describe, it, expect } from "vite-plus/test";
import { addMonths, parseMonth } from "./month.js";

describe("parseMonth", () => {
  it("accepts YYYY-MM", () => {
    expect(parseMonth("2026-02")).toBe("2026-02");
  });

  it("rejects anything else", () => {
    expect(parseMonth("2026-13")).toBeUndefined();
    expect(parseMonth("2026-2")).toBeUndefined();
    expect(parseMonth("february")).toBeUndefined();
    expect(parseMonth(202602)).toBeUndefined();
    expect(parseMonth(undefined)).toBeUndefined();
  });
});

describe("addMonths", () => {
  it("rolls over year boundaries", () => {
    expect(addMonths("2026-12", 1)).toBe("2027-01");
    expect(addMonths("2026-01", -1)).toBe("2025-12");
  });
});
