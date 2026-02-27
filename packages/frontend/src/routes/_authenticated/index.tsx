import { useState, useMemo } from "react";
import { createFileRoute } from "@tanstack/react-router";
import styled, { useTheme } from "styled-components";
import type { CategorySummary } from "@budget-app/shared";
import {
  useMonthlySummary,
  useTransactions,
} from "../../hooks/useTransactions.js";
import { MonthPicker } from "../../components/MonthPicker.js";
import { CategoryExpenseCard } from "../../components/CategoryExpenseCard.js";
import { ProgressBar } from "../../components/ProgressBar.js";
import { LayoutDashboard } from "lucide-react";
import { PageTitle, EmptyState, TitleRow } from "../../components/ui.js";

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;

  @media (max-width: 640px) {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }
`;

const StatCards = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
  gap: 16px;
  margin-bottom: 24px;
`;

const StatCard = styled.div<{ $accent: string }>`
  background: ${(p) => p.theme.colors.card};
  border-radius: ${(p) => p.theme.radii.lg};
  box-shadow: ${(p) => p.theme.shadows.card};
  padding: 16px 20px;
  border-left: 4px solid ${(p) => p.$accent};
  transition:
    transform 0.2s,
    box-shadow 0.2s;

  &:hover {
    transform: translateY(-2px);
    box-shadow: ${(p) => p.theme.shadows.cardHover};
  }
`;

const StatLabel = styled.div`
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: ${(p) => p.theme.colors.textMuted};
  margin-bottom: 4px;
`;

const StatValue = styled.div<{ $color?: string }>`
  font-size: 22px;
  font-weight: 700;
  color: ${(p) => p.$color ?? p.theme.colors.text};
`;

const TotalSummary = styled.div`
  @media (max-width: 640px) {
    width: 100%;
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    background: ${(p) => p.theme.colors.card};
    border-radius: ${(p) => p.theme.radii.lg};
    box-shadow: ${(p) => p.theme.shadows.card};
    border-left: 4px solid ${(p) => p.theme.colors.primary};
    padding: 12px 16px;
  }
`;

const TotalAmount = styled.div`
  font-size: 28px;
  font-weight: 700;
  color: ${(p) => p.theme.colors.text};
  white-space: nowrap;

  @media (max-width: 640px) {
    font-size: 24px;
  }
`;

const TotalLabel = styled.div`
  font-size: 13px;
  color: ${(p) => p.theme.colors.textMuted};
  text-align: right;

  @media (max-width: 640px) {
    text-align: left;
  }
`;

const CardList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const SectionTitle = styled.h2`
  font-size: 14px;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: ${(p) => p.theme.colors.textMuted};
  margin: 24px 0 12px;
`;

const SectionHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  margin-bottom: 8px;
`;

const SectionSubtotal = styled.span`
  font-size: 13px;
  color: ${(p) => p.theme.colors.textMuted};
`;

function formatAmount(cents: number): string {
  return (cents / 100).toFixed(2) + " \u20AC";
}

function getCurrentMonth(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

export const Route = createFileRoute("/_authenticated/")({
  component: DashboardPage,
});

function DashboardPage() {
  const theme = useTheme();
  const [month, setMonth] = useState(getCurrentMonth);
  const summaryQuery = useMonthlySummary(month);
  const transactionsQuery = useTransactions(month);

  const { fixedCategories, variableCategories } = useMemo(() => {
    const categories = summaryQuery.data?.categories ?? [];
    const fixed: CategorySummary[] = [];
    const variable: CategorySummary[] = [];
    for (const cat of categories) {
      const type = cat.type ?? "variable";
      if (type === "fixed") {
        fixed.push(cat);
      } else {
        variable.push(cat);
      }
    }
    return { fixedCategories: fixed, variableCategories: variable };
  }, [summaryQuery.data?.categories]);

  if (summaryQuery.isLoading) {
    return <EmptyState>Loading...</EmptyState>;
  }

  const summary = summaryQuery.data;
  const txList = transactionsQuery.data?.transactions ?? [];

  if (!summary || summary.totalAmount === 0) {
    return (
      <>
        <TitleRow>
          <LayoutDashboard size={28} strokeWidth={2} />
          <PageTitle>Dashboard</PageTitle>
        </TitleRow>
        <Header>
          <MonthPicker month={month} onChange={setMonth} />
        </Header>
        <EmptyState>No transactions for this month.</EmptyState>
      </>
    );
  }

  const fixedTotal = fixedCategories.reduce((s, c) => s + c.totalAmount, 0);
  const variableTotal = variableCategories.reduce(
    (s, c) => s + c.totalAmount,
    0,
  );

  const renderCategorySection = (
    title: string,
    categories: CategorySummary[],
    subtotal: number,
  ) =>
    categories.length > 0 ? (
      <>
        <SectionHeader>
          <SectionTitle>{title}</SectionTitle>
          <SectionSubtotal>{formatAmount(subtotal)}</SectionSubtotal>
        </SectionHeader>
        <CardList>
          {categories.map((cat) => (
            <CategoryExpenseCard
              key={cat.id}
              name={cat.name}
              totalAmount={cat.totalAmount}
              transactionCount={cat.transactionCount}
              transactions={txList.filter(
                (tx) => tx.budgetCategoryId === cat.id,
              )}
              budgetAmountCents={cat.budgetAmountCents}
              unbudgeted={
                !(cat.budgetAmountCents != null && cat.budgetAmountCents > 0) &&
                cat.totalAmount > 0
              }
            />
          ))}
        </CardList>
      </>
    ) : null;

  const unbudgetedSpendingTotal =
    summary.categories
      .filter(
        (c) =>
          !(c.budgetAmountCents != null && c.budgetAmountCents > 0) &&
          c.totalAmount > 0,
      )
      .reduce((s, c) => s + c.totalAmount, 0) +
    summary.uncategorized.totalAmount;

  const budgetRemaining =
    summary.globalBudgetCents != null && summary.globalBudgetCents > 0
      ? summary.globalBudgetCents - summary.totalAmount
      : null;

  return (
    <>
      <TitleRow>
        <LayoutDashboard size={28} strokeWidth={2} />
        <PageTitle>Dashboard</PageTitle>
      </TitleRow>
      <Header>
        <MonthPicker month={month} onChange={setMonth} />
        <TotalSummary>
          <TotalLabel>Total spent</TotalLabel>
          <TotalAmount>
            {formatAmount(summary.totalAmount)}
            {summary.globalBudgetCents
              ? ` / ${formatAmount(summary.globalBudgetCents)}`
              : ""}
          </TotalAmount>
          {summary.globalBudgetCents != null &&
            summary.globalBudgetCents > 0 && (
              <ProgressBar
                spent={summary.totalAmount}
                budget={summary.globalBudgetCents}
              />
            )}
        </TotalSummary>
      </Header>

      <StatCards>
        {budgetRemaining != null && (
          <StatCard
            $accent={
              budgetRemaining >= 0 ? theme.colors.primary : theme.colors.danger
            }
          >
            <StatLabel>Budget remaining</StatLabel>
            <StatValue
              $color={budgetRemaining >= 0 ? undefined : theme.colors.danger}
            >
              {formatAmount(Math.max(0, budgetRemaining))}
            </StatValue>
          </StatCard>
        )}
        {unbudgetedSpendingTotal > 0 && (
          <StatCard $accent={theme.colors.textMuted}>
            <StatLabel>Unbudgeted spending</StatLabel>
            <StatValue>{formatAmount(unbudgetedSpendingTotal)}</StatValue>
          </StatCard>
        )}
      </StatCards>

      {renderCategorySection(
        "Variable expenses",
        variableCategories,
        variableTotal,
      )}
      {renderCategorySection("Fixed expenses", fixedCategories, fixedTotal)}

      {summary.uncategorized.transactionCount > 0 && (
        <>
          <SectionTitle>Uncategorized</SectionTitle>
          <CategoryExpenseCard
            name="Uncategorized"
            totalAmount={summary.uncategorized.totalAmount}
            transactionCount={summary.uncategorized.transactionCount}
            transactions={txList.filter((tx) => !tx.budgetCategoryId)}
          />
        </>
      )}
    </>
  );
}
