import { describe, it, expect } from "vite-plus/test";
import type { Transaction } from "@budget-app/shared";
import {
  filterTransactions,
  formatDayHeader,
  groupByDay,
  merchantName,
  totalSpent,
} from "./transactions.js";

function tx(overrides: Partial<Transaction>): Transaction {
  return {
    id: 1,
    dateOperation: "2026-02-16",
    labelSimplified: "LES TILLEULS",
    labelOperation: "CB LES TILLEULS FACT 130226",
    amount: 310,
    bankCategory: "Alimentation",
    bankSubCategory: "Restaurant",
    budgetCategoryId: 1,
    budgetCategoryName: "Nourriture",
    displayName: null,
    reference: null,
    additionalInfo: null,
    operationType: "Carte bancaire",
    excluded: false,
    excludedReason: null,
    reimbursedAmount: 0,
    reimbursementNote: null,
    categoryLocked: false,
    ...overrides,
  };
}

describe("merchantName", () => {
  it("title-cases the bank label", () => {
    expect(merchantName(tx({}))).toBe("Les Tilleuls");
  });

  it("prefers the merchant alias", () => {
    expect(merchantName(tx({ displayName: "Le resto du coin" }))).toBe("Le resto du coin");
  });
});

describe("totalSpent", () => {
  it("deducts reimbursements and ignores excluded transactions", () => {
    const list = [
      tx({ id: 1, amount: 5000, reimbursedAmount: 3000 }),
      tx({ id: 2, amount: 1200 }),
      tx({ id: 3, amount: 9900, excluded: true }),
    ];
    expect(totalSpent(list)).toBe(3200);
  });
});

describe("filterTransactions", () => {
  const list = [
    tx({ id: 1, labelSimplified: "CARREFOUR", budgetCategoryId: 1 }),
    tx({ id: 2, labelSimplified: "UBER EATS", budgetCategoryId: 2 }),
    tx({ id: 3, labelSimplified: "MYSTERY", budgetCategoryId: null, budgetCategoryName: null }),
  ];

  it("returns everything without filters", () => {
    expect(filterTransactions(list, { search: "", category: "all" })).toHaveLength(3);
  });

  it("searches the merchant name case-insensitively", () => {
    const result = filterTransactions(list, { search: "uber", category: "all" });
    expect(result.map((t) => t.id)).toEqual([2]);
  });

  it("also searches the original bank label", () => {
    const result = filterTransactions(list, { search: "fact 130226", category: "all" });
    expect(result).toHaveLength(3);
  });

  it("filters by category id", () => {
    expect(filterTransactions(list, { search: "", category: "1" }).map((t) => t.id)).toEqual([1]);
  });

  it("filters uncategorized transactions", () => {
    expect(
      filterTransactions(list, { search: "", category: "uncategorized" }).map((t) => t.id),
    ).toEqual([3]);
  });
});

describe("groupByDay", () => {
  it("groups by date, most recent day first, with daily totals", () => {
    const groups = groupByDay([
      tx({ id: 1, dateOperation: "2026-02-14", amount: 2251 }),
      tx({ id: 2, dateOperation: "2026-02-16", amount: 310 }),
      tx({ id: 3, dateOperation: "2026-02-16", amount: 418 }),
      tx({ id: 4, dateOperation: "2026-02-16", amount: 1215, excluded: true }),
    ]);

    expect(groups.map((g) => g.date)).toEqual(["2026-02-16", "2026-02-14"]);
    expect(groups[0].totalCents).toBe(728);
    expect(groups[0].transactions.map((t) => t.id)).toEqual([4, 3, 2]);
    expect(groups[1].totalCents).toBe(2251);
  });
});

describe("formatDayHeader", () => {
  it("formats weekday, day and month", () => {
    expect(formatDayHeader("2026-02-16")).toBe("Mon 16 Feb");
  });
});
