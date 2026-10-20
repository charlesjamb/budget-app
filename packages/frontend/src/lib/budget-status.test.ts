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

  it("is over as soon as the budget is exceeded, whatever the type", () => {
    expect(getBudgetStatus(10001, 10000, "variable")).toBe("over");
    expect(getBudgetStatus(10001, 10000, "fixed")).toBe("over");
  });

  it("is unbudgeted without a positive budget", () => {
    expect(getBudgetStatus(5000, undefined)).toBe("unbudgeted");
    expect(getBudgetStatus(5000, null)).toBe("unbudgeted");
    expect(getBudgetStatus(5000, 0)).toBe("unbudgeted");
  });
});
