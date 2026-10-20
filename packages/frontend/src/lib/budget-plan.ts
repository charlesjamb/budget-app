export type RowDelta =
  | { kind: "same" }
  | { kind: "new" }
  | { kind: "up"; cents: number }
  | { kind: "down"; cents: number };

/** Parses a typed amount ("12.5", "12,50") to cents; empty or invalid input counts as 0. */
export function parseAmountToCents(value: string): number {
  const parsed = parseFloat(value.replace(",", "."));
  return Number.isFinite(parsed) && parsed > 0 ? Math.round(parsed * 100) : 0;
}

/** How this month's budget for a category moved relative to the previous month's. */
export function getRowDelta(currentCents: number, previousCents: number): RowDelta {
  if (currentCents === previousCents) return { kind: "same" };
  if (previousCents === 0) return { kind: "new" };
  const diff = currentCents - previousCents;
  return diff > 0 ? { kind: "up", cents: diff } : { kind: "down", cents: -diff };
}
