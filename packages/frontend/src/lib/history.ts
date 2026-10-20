/** Rounds a chart maximum up to a 1/2/5 × 10ⁿ step so axis ticks are readable. */
export function niceCeil(value: number): number {
  if (value <= 0) return 1;
  const magnitude = 10 ** Math.floor(Math.log10(value));
  const normalized = value / magnitude;
  const step = normalized <= 1 ? 1 : normalized <= 2 ? 2 : normalized <= 5 ? 5 : 10;
  return step * magnitude;
}

/** Mean over every month in range, counting months without spending as 0. */
export function averageOverMonths(amounts: Record<string, number>, months: string[]): number {
  if (months.length === 0) return 0;
  return Math.round(months.reduce((sum, m) => sum + (amounts[m] ?? 0), 0) / months.length);
}

export function isOverBudget(spentCents: number, budgetCents: number | undefined): boolean {
  return budgetCents !== undefined && budgetCents > 0 && spentCents > budgetCents;
}
