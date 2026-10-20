import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import styled from "styled-components";
import { ChevronDown, ChevronUp } from "lucide-react";
import type { CategorySummary, Transaction } from "@budget-app/shared";
import { useMonthlySummary, useTransactions } from "../../hooks/useTransactions.js";
import { useAuth } from "../../hooks/useAuth.js";
import { MonthPicker } from "../../components/MonthPicker.js";
import { useMonth } from "../../hooks/useMonth.js";
import { CategoryRow } from "../../components/CategoryRow.js";
import { ProgressBar } from "../../components/ProgressBar.js";
import { formatAmount } from "../../components/Amount.js";
import { PageTitle, EmptyState, Header, SectionHeader, Card } from "../../components/ui.js";
import { getBudgetStatus } from "../../lib/budget-status.js";

const Hero = styled.section`
  display: grid;
  grid-template-columns: minmax(0, 1.6fr) minmax(0, 1fr);
  gap: ${(p) => p.theme.space.xl};
  align-items: center;
  margin-bottom: ${(p) => p.theme.space.sm};

  @media (max-width: 640px) {
    grid-template-columns: minmax(0, 1fr);
    gap: ${(p) => p.theme.space.lg};
  }
`;

const HeroMain = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${(p) => p.theme.space.sm};
`;

const HeroAmount = styled.div<{ $over?: boolean }>`
  font-size: ${(p) => p.theme.fontSize.hero};
  font-weight: 700;
  line-height: 1.1;
  font-variant-numeric: tabular-nums;
  color: ${(p) => (p.$over ? p.theme.colors.over : p.theme.colors.text)};

  small {
    font-size: ${(p) => p.theme.fontSize.xl};
    font-weight: 500;
    color: ${(p) => (p.$over ? p.theme.colors.over : p.theme.colors.textMuted)};
  }
`;

const HeroSub = styled.div`
  font-size: ${(p) => p.theme.fontSize.md};
  color: ${(p) => p.theme.colors.textMuted};
`;

const Callout = styled.aside`
  background: ${(p) => p.theme.colors.card};
  border: 1px solid ${(p) => p.theme.colors.border};
  border-radius: ${(p) => p.theme.radii.lg};
  padding: ${(p) => p.theme.space.md} ${(p) => p.theme.space.lg};
  font-size: ${(p) => p.theme.fontSize.sm};
  color: ${(p) => p.theme.colors.textMuted};
  display: flex;
  flex-direction: column;
  gap: 2px;

  strong {
    color: ${(p) => p.theme.colors.text};
    font-size: ${(p) => p.theme.fontSize.xs};
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  a {
    color: ${(p) => p.theme.colors.primary};
    font-weight: 500;
    text-decoration: none;
  }

  a:hover {
    text-decoration: underline;
  }
`;

const GroupHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  gap: ${(p) => p.theme.space.md};
`;

const GroupTotal = styled.span`
  font-size: ${(p) => p.theme.fontSize.sm};
  color: ${(p) => p.theme.colors.textMuted};
  font-variant-numeric: tabular-nums;
`;

const FixedSummary = styled.button`
  width: 100%;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: ${(p) => p.theme.space.md};
  padding: ${(p) => p.theme.space.md} ${(p) => p.theme.space.lg};
  background: transparent;
  border: none;
  border-bottom: 1px solid ${(p) => p.theme.colors.border};
  color: ${(p) => p.theme.colors.text};
  font-size: ${(p) => p.theme.fontSize.md};
  cursor: pointer;
  text-align: left;

  &:hover {
    background: ${(p) => p.theme.colors.background};
  }
`;

const FixedToggle = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  color: ${(p) => p.theme.colors.primary};
  font-size: ${(p) => p.theme.fontSize.sm};
  white-space: nowrap;
`;

const Greeting = styled(PageTitle)`
  font-size: ${(p) => p.theme.fontSize.lg};
  font-weight: 500;
  color: ${(p) => p.theme.colors.textMuted};
  margin-bottom: ${(p) => p.theme.space.lg};
`;

function sumOf(categories: CategorySummary[], pick: (c: CategorySummary) => number): number {
  return categories.reduce((sum, c) => sum + pick(c), 0);
}

export const Route = createFileRoute("/_authenticated/")({
  component: DashboardPage,
});

function DashboardPage() {
  const [month, setMonth] = useMonth();
  const { user } = useAuth();
  const [fixedOpen, setFixedOpen] = useState(false);
  const summaryQuery = useMonthlySummary(month);
  const transactionsQuery = useTransactions(month);

  const { attention, variable, fixed, unbudgeted } = useMemo(() => {
    const attention: CategorySummary[] = [];
    const variable: CategorySummary[] = [];
    const fixed: CategorySummary[] = [];
    const unbudgeted: CategorySummary[] = [];

    for (const cat of summaryQuery.data?.categories ?? []) {
      const type = cat.type ?? "variable";
      const status = getBudgetStatus(cat.totalAmount, cat.budgetAmountCents, type);
      if (status === "unbudgeted") {
        if (cat.totalAmount > 0) unbudgeted.push(cat);
      } else if (status === "over") {
        attention.push(cat);
      } else if (type === "fixed") {
        fixed.push(cat);
      } else {
        variable.push(cat);
      }
    }

    const overage = (c: CategorySummary) => c.totalAmount - (c.budgetAmountCents ?? 0);
    attention.sort((a, b) => overage(b) - overage(a));
    variable.sort((a, b) => b.totalAmount - a.totalAmount);
    fixed.sort((a, b) => b.totalAmount - a.totalAmount);
    return { attention, variable, fixed, unbudgeted };
  }, [summaryQuery.data?.categories]);

  if (summaryQuery.isLoading) {
    return <EmptyState>Loading...</EmptyState>;
  }

  const summary = summaryQuery.data;
  const txList: Transaction[] = transactionsQuery.data?.transactions ?? [];
  const greeting = user?.displayName ? `Hi ${user.displayName}` : "Overview";

  const title = (
    <>
      <Header>
        <MonthPicker month={month} onChange={setMonth} />
      </Header>
      <Greeting>{greeting}</Greeting>
    </>
  );

  if (!summary || summary.totalAmount === 0) {
    return (
      <>
        {title}
        <EmptyState>No transactions for this month.</EmptyState>
      </>
    );
  }

  const budget = summary.globalBudgetCents ?? 0;
  const left = budget - summary.totalAmount;
  const unbudgetedTotal =
    sumOf(unbudgeted, (c) => c.totalAmount) + summary.uncategorized.totalAmount;
  const unbudgetedNames = [
    ...unbudgeted.map((c) => c.name),
    ...(summary.uncategorized.totalAmount > 0 ? ["Uncategorized"] : []),
  ];

  const renderRow = (cat: CategorySummary) => (
    <CategoryRow
      key={cat.id}
      name={cat.name}
      icon={cat.icon}
      type={cat.type}
      totalAmount={cat.totalAmount}
      transactionCount={cat.transactionCount}
      transactions={txList.filter((tx) => tx.budgetCategoryId === cat.id)}
      budgetAmountCents={cat.budgetAmountCents}
    />
  );

  const paidCount = fixed.filter(
    (c) => getBudgetStatus(c.totalAmount, c.budgetAmountCents, "fixed") === "paid",
  ).length;

  return (
    <>
      {title}

      <Hero>
        <HeroMain>
          {budget > 0 ? (
            <HeroAmount $over={left < 0}>
              {formatAmount(Math.abs(left), { decimals: 0 })}{" "}
              <small>{left < 0 ? "over" : "left"}</small>
            </HeroAmount>
          ) : (
            <HeroAmount>
              {formatAmount(summary.totalAmount, { decimals: 0 })} <small>spent</small>
            </HeroAmount>
          )}
          {budget > 0 && (
            <>
              <HeroSub>
                of {formatAmount(budget, { decimals: 0 })} ·{" "}
                {formatAmount(summary.totalAmount, { decimals: 0 })} spent
              </HeroSub>
              <ProgressBar spent={summary.totalAmount} budget={budget} />
            </>
          )}
        </HeroMain>

        {unbudgetedTotal > 0 && (
          <Callout>
            <strong>Unbudgeted</strong>
            <span>
              {formatAmount(unbudgetedTotal, { decimals: 0 })} · {unbudgetedNames.join(", ")}
            </span>
            <Link to="/budget" search={{ month }}>
              → Budget
            </Link>
          </Callout>
        )}
      </Hero>

      {attention.length > 0 && (
        <>
          <SectionHeader>Needs attention</SectionHeader>
          <Card>{attention.map(renderRow)}</Card>
        </>
      )}

      {variable.length > 0 && (
        <>
          <GroupHeader>
            <SectionHeader>Variable</SectionHeader>
            <GroupTotal>
              {formatAmount(
                sumOf(variable, (c) => c.totalAmount),
                { decimals: 0 },
              )}{" "}
              /{" "}
              {formatAmount(
                sumOf(variable, (c) => c.budgetAmountCents ?? 0),
                { decimals: 0 },
              )}
            </GroupTotal>
          </GroupHeader>
          <Card>{variable.map(renderRow)}</Card>
        </>
      )}

      {fixed.length > 0 && (
        <>
          <SectionHeader>Fixed</SectionHeader>
          <Card>
            <FixedSummary
              type="button"
              onClick={() => setFixedOpen(!fixedOpen)}
              aria-expanded={fixedOpen}
            >
              <span>
                {paidCount} of {fixed.length} paid{paidCount === fixed.length ? " ✓" : ""} ·{" "}
                {formatAmount(
                  sumOf(fixed, (c) => c.totalAmount),
                  { decimals: 0 },
                )}
              </span>
              <FixedToggle>
                {fixedOpen ? "Hide" : "Show"}
                {fixedOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </FixedToggle>
            </FixedSummary>
            {fixedOpen && fixed.map(renderRow)}
          </Card>
        </>
      )}

      {summary.uncategorized.transactionCount > 0 && (
        <>
          <SectionHeader>Uncategorized</SectionHeader>
          <Card>
            <CategoryRow
              name="Uncategorized"
              totalAmount={summary.uncategorized.totalAmount}
              transactionCount={summary.uncategorized.transactionCount}
              transactions={txList.filter((tx) => !tx.budgetCategoryId)}
            />
          </Card>
        </>
      )}
    </>
  );
}
