import type { MappingRule } from "@budget-app/shared";

/**
 * Category ids already used by rules for this bank sub-category, most used first —
 * the likeliest answers when classifying a new merchant of the same kind.
 */
export function suggestCategoryIds(rules: MappingRule[], bankSubCategory: string): number[] {
  const counts = new Map<number, number>();
  for (const rule of rules) {
    if (rule.bankSubCategory === bankSubCategory) {
      counts.set(rule.budgetCategoryId, (counts.get(rule.budgetCategoryId) ?? 0) + 1);
    }
  }
  return [...counts.entries()].sort((a, b) => b[1] - a[1]).map(([id]) => id);
}

/** Puts skipped groups after the untouched ones, in the order they were skipped. */
export function orderQueue<T>(items: T[], keyOf: (item: T) => string, skipped: string[]): T[] {
  const rank = (item: T) => skipped.indexOf(keyOf(item));
  return [...items].sort((a, b) => rank(a) - rank(b));
}
