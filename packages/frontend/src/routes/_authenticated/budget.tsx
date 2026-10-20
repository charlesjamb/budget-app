import { useState, useMemo, useRef, useEffect } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import styled from "styled-components";
import { Wallet } from "lucide-react";
import type { BudgetCategory } from "@budget-app/shared";
import { FlowSteps } from "../../components/FlowSteps.js";
import { MonthPicker } from "../../components/MonthPicker.js";
import { formatAmount } from "../../components/Amount.js";
import {
  SecondaryButton,
  AmountInput,
  Header,
  EmptyState,
  PageTitle,
  TitleRow,
  SectionHeader,
} from "../../components/ui.js";
import { useMonth } from "../../hooks/useMonth.js";
import { useCategories } from "../../hooks/useCategories.js";
import { useMonthlySummary } from "../../hooks/useTransactions.js";
import { useBudgets, useUpsertBudgets, useCopyBudget } from "../../hooks/useBudgets.js";
import { addMonths } from "../../lib/month.js";
import { getRowDelta, parseAmountToCents, type RowDelta } from "../../lib/budget-plan.js";

const FLASH_MS = 1500;

const GRID_COLUMNS = "minmax(0, 1fr) 88px 88px 112px 72px";

const Summary = styled.div`
  display: flex;
  align-items: baseline;
  gap: ${(p) => p.theme.space.sm} ${(p) => p.theme.space.md};
  flex-wrap: wrap;
`;

const PlannedTotal = styled.span`
  font-size: ${(p) => p.theme.fontSize.xxl};
  font-weight: 700;
  font-variant-numeric: tabular-nums;
`;

const PlannedLabel = styled.span`
  color: ${(p) => p.theme.colors.textMuted};
  font-size: ${(p) => p.theme.fontSize.lg};
`;

const TotalDelta = styled.span<{ $tone: "up" | "down" | "same" }>`
  font-size: ${(p) => p.theme.fontSize.md};
  font-variant-numeric: tabular-nums;
  color: ${(p) => (p.$tone === "same" ? p.theme.colors.textMuted : p.theme.colors.text)};
`;

const TypeHeader = styled(SectionHeader)`
  display: flex;
  justify-content: space-between;
`;

const GroupTitle = styled.h3`
  font-size: ${(p) => p.theme.fontSize.sm};
  font-weight: 600;
  color: ${(p) => p.theme.colors.textMuted};
  margin: ${(p) => p.theme.space.md} 0 ${(p) => p.theme.space.xs};
`;

const ColumnHeads = styled.div`
  display: grid;
  grid-template-columns: ${GRID_COLUMNS};
  gap: ${(p) => p.theme.space.md};
  padding: 0 ${(p) => p.theme.space.lg};
  font-size: ${(p) => p.theme.fontSize.xs};
  color: ${(p) => p.theme.colors.textLight};
  text-align: right;

  span:first-child {
    text-align: left;
  }

  @media (max-width: 640px) {
    display: none;
  }
`;

const CategoryList = styled.div`
  background: ${(p) => p.theme.colors.card};
  border-radius: ${(p) => p.theme.radii.lg};
  box-shadow: ${(p) => p.theme.shadows.card};
  overflow: hidden;
`;

const Row = styled.div`
  display: grid;
  grid-template-columns: ${GRID_COLUMNS};
  align-items: center;
  gap: ${(p) => p.theme.space.sm} ${(p) => p.theme.space.md};
  padding: ${(p) => p.theme.space.md} ${(p) => p.theme.space.lg};
  border-bottom: 1px solid ${(p) => p.theme.colors.border};

  &:last-child {
    border-bottom: none;
  }

  @media (max-width: 640px) {
    grid-template-columns: minmax(0, 1fr) 112px;
    grid-template-areas:
      "name input"
      "prev delta";
  }
`;

const Name = styled.span`
  font-size: ${(p) => p.theme.fontSize.lg};
  min-width: 0;

  @media (max-width: 640px) {
    grid-area: name;
  }
`;

const Muted = styled.span<{ $over?: boolean }>`
  font-size: ${(p) => p.theme.fontSize.sm};
  font-variant-numeric: tabular-nums;
  text-align: right;
  white-space: nowrap;
  color: ${(p) => (p.$over ? p.theme.colors.over : p.theme.colors.textMuted)};

  @media (max-width: 640px) {
    display: none;
  }
`;

const PrevInline = styled.span`
  display: none;
  font-size: ${(p) => p.theme.fontSize.xs};
  color: ${(p) => p.theme.colors.textMuted};
  font-variant-numeric: tabular-nums;

  @media (max-width: 640px) {
    display: block;
    grid-area: prev;
  }
`;

const InputCell = styled.div`
  @media (max-width: 640px) {
    grid-area: input;
  }

  input {
    width: 100%;
    padding: 6px 10px;
  }
`;

const DeltaCell = styled.span<{ $kind: RowDelta["kind"] | "error" }>`
  font-size: ${(p) => p.theme.fontSize.sm};
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
  color: ${(p) =>
    p.$kind === "error"
      ? p.theme.colors.over
      : p.$kind === "new"
        ? p.theme.colors.primary
        : p.theme.colors.textMuted};

  @media (max-width: 640px) {
    grid-area: delta;
    text-align: right;
  }
`;

const Footer = styled.div`
  display: flex;
  justify-content: flex-end;
  margin: ${(p) => p.theme.space.xl} 0;

  a {
    color: ${(p) => p.theme.colors.primary};
    font-weight: 600;
    text-decoration: none;
  }

  a:hover {
    text-decoration: underline;
  }
`;

function monthName(month: string): string {
  const [y, m] = month.split("-").map(Number);
  return new Date(y, m - 1, 1).toLocaleString("en-US", { month: "long" });
}

function shortMonthName(month: string): string {
  const [y, m] = month.split("-").map(Number);
  return new Date(y, m - 1, 1).toLocaleString("en-US", { month: "short" });
}

function formatDelta(delta: RowDelta): string {
  switch (delta.kind) {
    case "up":
      return `↑ ${formatAmount(delta.cents, { decimals: 0 })}`;
    case "down":
      return `↓ ${formatAmount(delta.cents, { decimals: 0 })}`;
    case "new":
      return "new";
    case "same":
      return "";
  }
}

interface RowData {
  category: BudgetCategory;
  budgetCents: number;
  prevBudgetCents: number;
  prevSpent: number;
}

export const Route = createFileRoute("/_authenticated/budget")({
  component: BudgetPage,
});

function BudgetPage() {
  const [month, setMonth] = useMonth();
  const prevMonth = addMonths(month, -1);
  const [localBudgets, setLocalBudgets] = useState<Record<number, string>>({});
  const [flashId, setFlashId] = useState<number | null>(null);
  const [errorId, setErrorId] = useState<number | null>(null);
  const flashTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => () => clearTimeout(flashTimer.current), []);

  const categoriesQuery = useCategories();
  const budgetsQuery = useBudgets(month);
  const prevBudgetsQuery = useBudgets(prevMonth);
  const prevSummaryQuery = useMonthlySummary(prevMonth);
  const upsertMutation = useUpsertBudgets();
  const copyMutation = useCopyBudget();

  const categories = useMemo(
    () => categoriesQuery.data?.categories ?? [],
    [categoriesQuery.data?.categories],
  );

  const budgetMap = useMemo(
    () => new Map((budgetsQuery.data?.budgets ?? []).map((b) => [b.categoryId, b.amountCents])),
    [budgetsQuery.data?.budgets],
  );
  const prevBudgetMap = useMemo(
    () => new Map((prevBudgetsQuery.data?.budgets ?? []).map((b) => [b.categoryId, b.amountCents])),
    [prevBudgetsQuery.data?.budgets],
  );
  const prevSpentMap = useMemo(
    () => new Map((prevSummaryQuery.data?.categories ?? []).map((c) => [c.id, c.totalAmount])),
    [prevSummaryQuery.data?.categories],
  );

  const currentCents = (categoryId: number): number =>
    localBudgets[categoryId] !== undefined
      ? parseAmountToCents(localBudgets[categoryId])
      : (budgetMap.get(categoryId) ?? 0);

  const inputValue = (categoryId: number): string => {
    if (localBudgets[categoryId] !== undefined) return localBudgets[categoryId];
    const server = budgetMap.get(categoryId);
    return server ? (server / 100).toFixed(2) : "";
  };

  const dropLocal = (categoryId: number) =>
    setLocalBudgets((prev) => {
      const { [categoryId]: _removed, ...rest } = prev;
      return rest;
    });

  const handleChange = (categoryId: number, value: string) => {
    setLocalBudgets((prev) => ({ ...prev, [categoryId]: value }));
    setErrorId(null);
  };

  const handleBlur = (categoryId: number) => {
    if (localBudgets[categoryId] === undefined) return;
    const amountCents = parseAmountToCents(localBudgets[categoryId]);
    if (amountCents === (budgetMap.get(categoryId) ?? 0)) {
      dropLocal(categoryId);
      return;
    }
    upsertMutation.mutate(
      { month, budgets: [{ categoryId, amountCents }] },
      {
        onSuccess: () => {
          dropLocal(categoryId);
          setFlashId(categoryId);
          clearTimeout(flashTimer.current);
          flashTimer.current = setTimeout(() => setFlashId(null), FLASH_MS);
        },
        onError: () => setErrorId(categoryId),
      },
    );
  };

  const handleMonthChange = (newMonth: string) => {
    setMonth(newMonth);
    setLocalBudgets({});
    setFlashId(null);
    setErrorId(null);
  };

  const handleCopy = () => {
    copyMutation.mutate(
      { sourceMonth: prevMonth, targetMonth: month },
      { onSuccess: () => setLocalBudgets({}) },
    );
  };

  const rows = categories.map<RowData>((category) => ({
    category,
    budgetCents: currentCents(category.id),
    prevBudgetCents: prevBudgetMap.get(category.id) ?? 0,
    prevSpent: prevSpentMap.get(category.id) ?? 0,
  }));

  const totalPlanned = rows.reduce((s, r) => s + r.budgetCents, 0);
  const totalPrev = rows.reduce((s, r) => s + r.prevBudgetCents, 0);
  const totalDiff = totalPlanned - totalPrev;
  const hasPrev = prevBudgetsQuery.data !== undefined && totalPrev > 0;

  const byType = { variable: new Map<string, RowData[]>(), fixed: new Map<string, RowData[]>() };
  for (const row of rows) {
    const groups = byType[row.category.type ?? "variable"];
    const group = row.category.groupName?.trim() ?? "";
    groups.set(group, [...(groups.get(group) ?? []), row]);
  }

  const sortGroupNames = (names: string[]) =>
    names.sort((a, b) => (a === "" ? 1 : b === "" ? -1 : a.localeCompare(b)));

  if (categoriesQuery.isLoading || budgetsQuery.isLoading) {
    return <EmptyState>Loading...</EmptyState>;
  }

  const prevName = monthName(prevMonth);

  return (
    <>
      <TitleRow>
        <Wallet size={28} strokeWidth={2} />
        <PageTitle>Budget</PageTitle>
      </TitleRow>

      <FlowSteps flow="plan" current="/budget" month={month} />

      <Header>
        <MonthPicker month={month} onChange={handleMonthChange} />
        <SecondaryButton onClick={handleCopy} disabled={copyMutation.isPending}>
          {copyMutation.isPending ? "Copying..." : `Start from ${prevName}`}
        </SecondaryButton>
      </Header>

      <Summary>
        <PlannedTotal>{formatAmount(totalPlanned, { decimals: 0 })}</PlannedTotal>
        <PlannedLabel>planned</PlannedLabel>
        {hasPrev && (
          <TotalDelta $tone={totalDiff > 0 ? "up" : totalDiff < 0 ? "down" : "same"}>
            {totalDiff === 0
              ? `same as ${prevName}`
              : `${formatAmount(totalDiff, { signed: true, decimals: 0 })} vs ${prevName}`}
          </TotalDelta>
        )}
      </Summary>

      {categories.length === 0 ? (
        <EmptyState>No categories yet. Create some in the Categories page first.</EmptyState>
      ) : (
        <>
          <ColumnHeads>
            <span />
            <span>{shortMonthName(prevMonth)} budget</span>
            <span>{shortMonthName(prevMonth)} spent</span>
            <span>{monthName(month)}</span>
            <span />
          </ColumnHeads>
          {(["variable", "fixed"] as const)
            .filter((type) => byType[type].size > 0)
            .map((type) => {
              const groups = byType[type];
              const typeTotal = [...groups.values()].flat().reduce((s, r) => s + r.budgetCents, 0);
              return (
                <section key={type}>
                  <TypeHeader>
                    <span>{type === "fixed" ? "Fixed expenses" : "Variable expenses"}</span>
                    <span>{formatAmount(typeTotal, { decimals: 0 })}</span>
                  </TypeHeader>
                  {sortGroupNames([...groups.keys()]).map((groupName) => (
                    <div key={`${type}-${groupName || "_"}`}>
                      {groupName && <GroupTitle>{groupName}</GroupTitle>}
                      <CategoryList>
                        {(groups.get(groupName) ?? []).map((row) => {
                          const { category: cat } = row;
                          const delta: RowDelta =
                            row.budgetCents === 0
                              ? { kind: "same" }
                              : getRowDelta(row.budgetCents, row.prevBudgetCents);
                          const overspent =
                            row.prevBudgetCents > 0 && row.prevSpent > row.prevBudgetCents;
                          const flashing = flashId === cat.id;
                          const failed = errorId === cat.id;
                          return (
                            <Row key={cat.id}>
                              <Name>
                                {cat.icon ? `${cat.icon} ` : ""}
                                {cat.name}
                              </Name>
                              <Muted>
                                {row.prevBudgetCents > 0
                                  ? formatAmount(row.prevBudgetCents, { decimals: 0 })
                                  : "–"}
                              </Muted>
                              <Muted $over={overspent}>
                                {formatAmount(row.prevSpent, { decimals: 0 })}
                                {overspent ? " ⚠" : ""}
                              </Muted>
                              <PrevInline>
                                {shortMonthName(prevMonth)}:{" "}
                                {row.prevBudgetCents > 0
                                  ? formatAmount(row.prevBudgetCents, { decimals: 0 })
                                  : "–"}{" "}
                                budget · {formatAmount(row.prevSpent, { decimals: 0 })} spent
                              </PrevInline>
                              <InputCell>
                                <AmountInput
                                  type="text"
                                  inputMode="decimal"
                                  placeholder="0.00"
                                  aria-label={`${cat.name} budget`}
                                  value={inputValue(cat.id)}
                                  onChange={(e) => handleChange(cat.id, e.target.value)}
                                  onBlur={() => handleBlur(cat.id)}
                                />
                              </InputCell>
                              <DeltaCell $kind={failed ? "error" : delta.kind} role="status">
                                {failed ? "Not saved" : flashing ? "✓" : formatDelta(delta)}
                              </DeltaCell>
                            </Row>
                          );
                        })}
                      </CategoryList>
                    </div>
                  ))}
                </section>
              );
            })}
        </>
      )}

      <Footer>
        <Link to="/plan/wires" search={{ month }}>
          Next: Wires →
        </Link>
      </Footer>
    </>
  );
}
