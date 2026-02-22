import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import styled from "styled-components";
import {
  useMonthlySummary,
  useTransactions,
} from "../../hooks/useTransactions.js";
import { MonthPicker } from "../../components/MonthPicker.js";
import { CategoryExpenseCard } from "../../components/CategoryExpenseCard.js";

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

const TotalSummary = styled.div`
  @media (max-width: 640px) {
    width: 100%;
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    background: #fff;
    border: 1px solid #e5e7eb;
    border-left: 4px solid #059669;
    border-radius: 8px;
    padding: 12px 16px;
  }
`;

const TotalAmount = styled.div`
  font-size: 28px;
  font-weight: 700;
  color: #059669;
  white-space: nowrap;

  @media (max-width: 640px) {
    font-size: 24px;
  }
`;

const TotalLabel = styled.div`
  font-size: 13px;
  color: #6b7280;
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
  color: #6b7280;
  margin: 24px 0 12px;
`;

const PageTitle = styled.h1`
  font-size: 24px;
  margin-bottom: 20px;
`;

const EmptyState = styled.p`
  text-align: center;
  color: #6b7280;
  padding: 48px 0;
  font-size: 16px;
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
  const [month, setMonth] = useState(getCurrentMonth);
  const summaryQuery = useMonthlySummary(month);
  const transactionsQuery = useTransactions(month);

  if (summaryQuery.isLoading) {
    return <EmptyState>Loading...</EmptyState>;
  }

  const summary = summaryQuery.data;
  const txList = transactionsQuery.data?.transactions ?? [];

  if (!summary || summary.totalAmount === 0) {
    return (
      <>
        <PageTitle>💰 Dashboard</PageTitle>
        <Header>
          <MonthPicker month={month} onChange={setMonth} />
        </Header>
        <EmptyState>No transactions for this month.</EmptyState>
      </>
    );
  }

  return (
    <>
      <PageTitle>💰 Dashboard</PageTitle>
      <Header>
        <MonthPicker month={month} onChange={setMonth} />
        <TotalSummary>
          <TotalLabel>Total spent</TotalLabel>
          <TotalAmount>{formatAmount(summary.totalAmount)}</TotalAmount>
        </TotalSummary>
      </Header>

      <CardList>
        {summary.categories.map((cat) => (
          <CategoryExpenseCard
            key={cat.id}
            name={cat.name}
            totalAmount={cat.totalAmount}
            transactionCount={cat.transactionCount}
            transactions={txList.filter((tx) => tx.budgetCategoryId === cat.id)}
          />
        ))}
      </CardList>

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
