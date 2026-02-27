import { useState } from "react";
import styled from "styled-components";
import type { Transaction } from "@budget-app/shared";
import { ProgressBar } from "./ProgressBar.js";

const Card = styled.div`
  background: ${(p) => p.theme.colors.card};
  border-radius: ${(p) => p.theme.radii.lg};
  box-shadow: ${(p) => p.theme.shadows.card};
  overflow: hidden;
  transition:
    transform 0.2s,
    box-shadow 0.2s;

  &:hover {
    transform: translateY(-2px);
    box-shadow: ${(p) => p.theme.shadows.cardHover};
  }
`;

const CardHeader = styled.button`
  width: 100%;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  background: ${(p) => p.theme.colors.card};
  border: none;
  cursor: pointer;
  text-align: left;

  &:hover {
    background: ${(p) => p.theme.colors.background};
  }
`;

const CategoryNameRow = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
`;


const CategoryName = styled.span`
  font-weight: 600;
  font-size: 16px;
`;

const UnbudgetedBadge = styled.span`
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: ${(p) => p.theme.colors.textMuted};
  background: ${(p) => p.theme.colors.background};
  padding: 2px 8px;
  border-radius: 4px;
  border: 1px solid ${(p) => p.theme.colors.border};
`;

const CategoryInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
`;

const Amount = styled.span`
  font-weight: 700;
  font-size: 16px;
  color: ${(p) => p.theme.colors.text};
`;

const Count = styled.span`
  color: ${(p) => p.theme.colors.textMuted};
  font-size: 13px;
`;

const TransactionList = styled.div`
  border-top: 1px solid ${(p) => p.theme.colors.border};
  padding: 0;
`;

const TransactionRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 20px;
  border-bottom: 1px solid ${(p) => p.theme.colors.border};
  font-size: 14px;
  min-width: 0;

  &:last-child {
    border-bottom: none;
  }

  @media (max-width: 640px) {
    padding: 10px 14px;
  }
`;

const TransactionDate = styled.span`
  color: ${(p) => p.theme.colors.textMuted};
  min-width: 90px;
  flex-shrink: 0;

  @media (max-width: 640px) {
    min-width: 72px;
    font-size: 12px;
  }
`;

const TransactionLabel = styled.span`
  flex: 1;
  margin: 0 12px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  min-width: 0;

  @media (max-width: 640px) {
    margin: 0 8px;
  }
`;

const TransactionAmount = styled.span`
  color: ${(p) => p.theme.colors.text};
  font-weight: 500;
`;

const ProgressWrapper = styled.div`
  padding: 0 20px 12px;
`;

function formatAmount(cents: number): string {
  return (cents / 100).toFixed(2) + " \u20AC";
}

function formatDate(dateStr: string): string {
  const [y, m, d] = dateStr.split("-");
  return `${d}/${m}/${y}`;
}

interface CategoryExpenseCardProps {
  name: string;
  totalAmount: number;
  transactionCount: number;
  transactions: Transaction[];
  budgetAmountCents?: number;
  unbudgeted?: boolean;
}

export function CategoryExpenseCard({
  name,
  totalAmount,
  transactionCount,
  transactions,
  budgetAmountCents,
  unbudgeted = false,
}: CategoryExpenseCardProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <Card>
      <CardHeader onClick={() => setExpanded(!expanded)}>
        <CategoryNameRow>
          <CategoryName>{name}</CategoryName>
          {unbudgeted && <UnbudgetedBadge>Unbudgeted</UnbudgetedBadge>}
        </CategoryNameRow>
        <CategoryInfo>
          <Count>{transactionCount} transactions</Count>
          <Amount>
            {formatAmount(totalAmount)}
            {budgetAmountCents ? ` / ${formatAmount(budgetAmountCents)}` : ""}
          </Amount>
        </CategoryInfo>
      </CardHeader>
      {budgetAmountCents != null && budgetAmountCents > 0 && (
        <ProgressWrapper>
          <ProgressBar spent={totalAmount} budget={budgetAmountCents} />
        </ProgressWrapper>
      )}
      {expanded && (
        <TransactionList>
          {transactions.map((tx) => (
            <TransactionRow key={tx.id}>
              <TransactionDate>{formatDate(tx.dateOperation)}</TransactionDate>
              <TransactionLabel>
                {tx.displayName || tx.labelSimplified}
              </TransactionLabel>
              <TransactionAmount>{formatAmount(tx.amount)}</TransactionAmount>
            </TransactionRow>
          ))}
        </TransactionList>
      )}
    </Card>
  );
}
