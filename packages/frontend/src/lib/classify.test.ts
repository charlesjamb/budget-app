import { describe, it, expect } from "vite-plus/test";
import { orderQueue, suggestCategoryIds } from "./classify.js";

const rule = (id: number, bankSubCategory: string, budgetCategoryId: number) => ({
  id,
  bankSubCategory,
  labelSimplified: `m${id}`,
  budgetCategoryId,
});

describe("suggestCategoryIds", () => {
  it("ranks categories used by rules of the same sub-category", () => {
    const rules = [
      rule(1, "Resto", 5),
      rule(2, "Resto", 7),
      rule(3, "Resto", 7),
      rule(4, "Autre", 9),
    ];
    expect(suggestCategoryIds(rules, "Resto")).toEqual([7, 5]);
  });

  it("is empty when no rule matches", () => {
    expect(suggestCategoryIds([rule(1, "Autre", 9)], "Resto")).toEqual([]);
  });
});

describe("orderQueue", () => {
  it("moves skipped items to the end in skip order", () => {
    expect(orderQueue(["a", "b", "c", "d"], (x) => x, ["a", "c"])).toEqual(["b", "d", "a", "c"]);
  });
});
