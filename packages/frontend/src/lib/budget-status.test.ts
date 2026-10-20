import { describe, it, expect } from "vite-plus/test";
import { getBudgetStatus } from "./budget-status.js";

describe("getBudgetStatus", () => {
  it("is ok well under budget", () => {
    expect(getBudgetStatus(8000, 20000)).toBe("ok");
  });

  it("turns amber from 90 % of the budget", () => {
    expect(getBudgetStatus(8999, 10000)).toBe("ok");
    expect(getBudgetStatus(9000, 10000)).toBe("warn");
  });

  it("treats exactly on budget as amber for variable expenses", () => {
    expect(getBudgetStatus(10000, 10000, "variable")).toBe("warn");
  });

  it("treats exactly on budget as paid for fixed expenses", () => {
    expect(getBudgetStatus(143400, 143400, "fixed")).toBe("paid");
  });

  it("treats a fixed expense within 1 € of its budget as paid, above or below", () => {
    expect(getBudgetStatus(2926, 2900, "fixed")).toBe("paid");
    expect(getBudgetStatus(134681, 134700, "fixed")).toBe("paid");
    expect(getBudgetStatus(10100, 10000, "fixed")).toBe("paid");
    expect(getBudgetStatus(9900, 10000, "fixed")).toBe("paid");
  });

  it("keeps a fixed expense over or under budget by more than 1 € as such", () => {
    expect(getBudgetStatus(10101, 10000, "fixed")).toBe("over");
    expect(getBudgetStatus(9800, 10000, "fixed")).toBe("warn");
  });

  it("does not mark an unspent fixed expense as paid", () => {
    expect(getBudgetStatus(0, 50, "fixed")).toBe("ok");
  });

  it("is over as soon as a variable budget is exceeded", () => {
    expect(getBudgetStatus(10001, 10000, "variable")).toBe("over");
  });

  it("is unbudgeted without a positive budget", () => {
    expect(getBudgetStatus(5000, undefined)).toBe("unbudgeted");
    expect(getBudgetStatus(5000, null)).toBe("unbudgeted");
    expect(getBudgetStatus(5000, 0)).toBe("unbudgeted");
  });
});
