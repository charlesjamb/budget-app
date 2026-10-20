import { useMemo } from "react";
import type { ContributionMember } from "@budget-app/shared";
import { computeShares } from "../lib/split.js";
import { parseAmountToCents } from "../lib/budget-plan.js";
import { useBudgets } from "./useBudgets.js";
import { useContributions } from "./useContributions.js";
import { useMonthlySummary } from "./useTransactions.js";

const NO_OVERRIDES: Record<number, string> = {};

/**
 * Shared by the Wires and Settle up pages:
 * ratio = revenue / Σ revenue, wire = budgeted × ratio, settlement = (spent − budgeted) × ratio.
 * `localRevenues` holds unsaved revenue inputs (as typed) that override the saved ones.
 */
export function useSplitComputation(month: string, localRevenues = NO_OVERRIDES) {
  const contributionsQuery = useContributions(month);
  const budgetsQuery = useBudgets(month);
  const summaryQuery = useMonthlySummary(month);

  const members = useMemo(
    () => contributionsQuery.data?.members ?? [],
    [contributionsQuery.data?.members],
  );

  const effectiveMembers: ContributionMember[] = useMemo(
    () =>
      members.map((m) => {
        const localVal = localRevenues[m.userId];
        const revenueCents = localVal !== undefined ? parseAmountToCents(localVal) : m.revenueCents;
        return { ...m, revenueCents };
      }),
    [members, localRevenues],
  );

  const totalRevenueCents = useMemo(
    () => effectiveMembers.reduce((sum, m) => sum + m.revenueCents, 0),
    [effectiveMembers],
  );

  const ratios = useMemo(() => {
    const map = new Map<number, number>();
    if (totalRevenueCents > 0) {
      for (const m of effectiveMembers) {
        map.set(m.userId, m.revenueCents / totalRevenueCents);
      }
    }
    return map;
  }, [effectiveMembers, totalRevenueCents]);

  const totalBudgetedCents = useMemo(
    () =>
      (budgetsQuery.data?.budgets ?? [])
        .filter((b) => b.categoryId !== 0)
        .reduce((sum, b) => sum + b.amountCents, 0),
    [budgetsQuery.data?.budgets],
  );

  const totalSpentCents = summaryQuery.data?.totalAmount ?? 0;
  const differenceCents = totalSpentCents - totalBudgetedCents;

  const wireAmounts = useMemo(() => {
    const shares = computeShares(
      totalBudgetedCents,
      effectiveMembers.map((m) => m.revenueCents),
    );
    return new Map(effectiveMembers.map((m, i) => [m.userId, shares[i]]));
  }, [effectiveMembers, totalBudgetedCents]);

  const settlementAmounts = useMemo(() => {
    const shares = computeShares(
      differenceCents,
      effectiveMembers.map((m) => m.revenueCents),
    );
    return new Map(effectiveMembers.map((m, i) => [m.userId, shares[i]]));
  }, [effectiveMembers, differenceCents]);

  return {
    isLoading: contributionsQuery.isLoading || budgetsQuery.isLoading,
    members,
    effectiveMembers,
    totalRevenueCents,
    ratios,
    totalBudgetedCents,
    totalSpentCents,
    differenceCents,
    wireAmounts,
    settlementAmounts,
  };
}
