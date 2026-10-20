import type { CategoryType } from "@budget-app/shared";

export type BudgetStatus = "ok" | "warn" | "over" | "paid" | "unbudgeted";

/** Spending at or above this share of the budget turns amber. */
export const WARN_RATIO = 0.9;

/** A fixed expense within this many cents of its budget counts as paid (rounded budgets, odd cents on bills). */
export const PAID_TOLERANCE_CENTS = 100;

/**
 * Single source of truth for how a category's spending compares to its budget:
 * over budget is red, ≥ 90 % amber, a fixed expense landing on budget (give or take
 * `PAID_TOLERANCE_CENTS`) is "paid".
 */
export function getBudgetStatus(
  spentCents: number,
  budgetCents: number | null | undefined,
  type: CategoryType = "variable",
): BudgetStatus {
  if (budgetCents == null || budgetCents <= 0) return "unbudgeted";
  if (
    type === "fixed" &&
    spentCents > 0 &&
    Math.abs(spentCents - budgetCents) <= PAID_TOLERANCE_CENTS
  ) {
    return "paid";
  }
  if (spentCents > budgetCents) return "over";
  if (spentCents / budgetCents >= WARN_RATIO) return "warn";
  return "ok";
}
