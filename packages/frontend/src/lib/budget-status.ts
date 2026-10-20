import type { CategoryType } from "@budget-app/shared";

export type BudgetStatus = "ok" | "warn" | "over" | "paid" | "unbudgeted";

/** Spending at or above this share of the budget turns amber. */
export const WARN_RATIO = 0.9;

/**
 * Single source of truth for how a category's spending compares to its budget:
 * over budget is red, ≥ 90 % amber, a fixed expense landing exactly on budget is "paid".
 */
export function getBudgetStatus(
  spentCents: number,
  budgetCents: number | null | undefined,
  type: CategoryType = "variable",
): BudgetStatus {
  if (budgetCents == null || budgetCents <= 0) return "unbudgeted";
  if (spentCents > budgetCents) return "over";
  if (type === "fixed" && spentCents === budgetCents) return "paid";
  if (spentCents / budgetCents >= WARN_RATIO) return "warn";
  return "ok";
}
