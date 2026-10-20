import type { Transaction } from "@budget-app/shared";
import { toTitleCase } from "./merchant.js";

export const UNCATEGORIZED_FILTER = "uncategorized";
export const ALL_CATEGORIES_FILTER = "all";

/** Name shown for a transaction: the merchant alias when defined, else the bank label in title case. */
export function merchantName(tx: Transaction): string {
  return tx.displayName ?? toTitleCase(tx.labelSimplified);
}

/** What the transaction really cost, once any reimbursement is deducted. */
export function effectiveAmount(tx: Transaction): number {
  return tx.amount - tx.reimbursedAmount;
}

/** Sum of what counts toward the budget (excluded transactions are left out). */
export function totalSpent(transactions: Transaction[]): number {
  return transactions.reduce((sum, tx) => (tx.excluded ? sum : sum + effectiveAmount(tx)), 0);
}

export interface TransactionFilters {
  search: string;
  /** "all", "uncategorized" or a category id as a string. */
  category: string;
}

export function filterTransactions(
  transactions: Transaction[],
  { search, category }: TransactionFilters,
): Transaction[] {
  const needle = search.trim().toLowerCase();
  return transactions.filter((tx) => {
    if (category === UNCATEGORIZED_FILTER && tx.budgetCategoryId !== null) return false;
    if (
      category !== ALL_CATEGORIES_FILTER &&
      category !== UNCATEGORIZED_FILTER &&
      String(tx.budgetCategoryId) !== category
    ) {
      return false;
    }
    if (!needle) return true;
    return (
      merchantName(tx).toLowerCase().includes(needle) ||
      tx.labelOperation.toLowerCase().includes(needle)
    );
  });
}

export interface DayGroup {
  date: string;
  transactions: Transaction[];
  totalCents: number;
}

/** Groups by operation date, most recent day first (and most recent transaction first within a day). */
export function groupByDay(transactions: Transaction[]): DayGroup[] {
  const byDate = new Map<string, Transaction[]>();
  for (const tx of transactions) {
    const list = byDate.get(tx.dateOperation) ?? [];
    list.push(tx);
    byDate.set(tx.dateOperation, list);
  }

  return [...byDate.entries()]
    .sort(([a], [b]) => (a < b ? 1 : a > b ? -1 : 0))
    .map(([date, list]) => ({
      date,
      transactions: [...list].sort((a, b) => b.id - a.id),
      totalCents: totalSpent(list),
    }));
}

/** "2026-02-16" → "Mon 16 Feb" */
export function formatDayHeader(dateStr: string): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  const parts = new Intl.DateTimeFormat("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
  }).formatToParts(new Date(y, m - 1, d));
  const pick = (type: string) => parts.find((p) => p.type === type)?.value ?? "";
  return `${pick("weekday")} ${pick("day")} ${pick("month")}`;
}
