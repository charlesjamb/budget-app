import { useState } from "react";
import styled from "styled-components";
import type { Transaction } from "@budget-app/shared";
import { ProgressBar } from "./ProgressBar.js";

const COLOR_PALETTE = [
  "#6366f1", // indigo
  "#0891b2", // cyan
  "#059669", // emerald
  "#d97706", // amber
  "#7c3aed", // violet
  "#0284c7", // sky
  "#0d9488", // teal
  "#c2410c", // orange
];

function getCategoryColor(name: string): string {
  let hash = 0;
  for (const char of name) {
    hash = (hash * 31 + char.charCodeAt(0)) % COLOR_PALETTE.length;
  }
  return COLOR_PALETTE[Math.abs(hash)];
}

const Card = styled.div<{ $color: string }>`
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

const CardHeader = styled.button<{ $color: string }>`
  width: 100%;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  background: ${(p) => `${p.$color}08`};
  border: none;
  cursor: pointer;
  text-align: left;

  &:hover {
    background: ${(p) => `${p.$color}12`};
  }
`;

const CategoryNameRow = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
`;

const ColorDot = styled.div<{ $color: string }>`
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: ${(p) => p.$color};
  flex-shrink: 0;
`;

const CategoryName = styled.span`
  font-weight: 600;
  font-size: 16px;
`;

const CategoryInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
`;

const Amount = styled.span<{ $color: string }>`
  font-weight: 700;
  font-size: 16px;
  color: ${(p) => p.$color};
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

const TransactionAmount = styled.span<{ $color: string }>`
  color: ${(p) => p.$color};
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
}

export function CategoryExpenseCard({
  name,
  totalAmount,
  transactionCount,
  transactions,
  budgetAmountCents,
}: CategoryExpenseCardProps) {
  const [expanded, setExpanded] = useState(false);
  const color = getCategoryColor(name);

  return (
    <Card $color={color}>
      <CardHeader $color={color} onClick={() => setExpanded(!expanded)}>
        <CategoryNameRow>
          <ColorDot $color={color} />
          <CategoryName>{name}</CategoryName>
        </CategoryNameRow>
        <CategoryInfo>
          <Count>{transactionCount} transactions</Count>
          <Amount $color={color}>
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
              <TransactionAmount $color={color}>
                {formatAmount(tx.amount)}
              </TransactionAmount>
            </TransactionRow>
          ))}
        </TransactionList>
      )}
    </Card>
  );
}
