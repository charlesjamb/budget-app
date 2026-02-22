import { useState } from "react";
import styled from "styled-components";
import type { Transaction } from "@budget-app/shared";

const Card = styled.div`
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  overflow: hidden;
`;

const CardHeader = styled.button`
  width: 100%;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  background: none;
  border: none;
  cursor: pointer;
  text-align: left;

  &:hover {
    background: #f9fafb;
  }
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

const Amount = styled.span`
  font-weight: 700;
  font-size: 16px;
  color: #dc2626;
`;

const Count = styled.span`
  color: #6b7280;
  font-size: 13px;
`;

const TransactionList = styled.div`
  border-top: 1px solid #e5e7eb;
  padding: 0;
`;

const TransactionRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 20px;
  border-bottom: 1px solid #f3f4f6;
  font-size: 14px;

  &:last-child {
    border-bottom: none;
  }
`;

const TransactionDate = styled.span`
  color: #6b7280;
  min-width: 90px;
`;

const TransactionLabel = styled.span`
  flex: 1;
  margin: 0 12px;
`;

const TransactionAmount = styled.span`
  color: #dc2626;
  font-weight: 500;
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
}

export function CategoryExpenseCard({
  name,
  totalAmount,
  transactionCount,
  transactions,
}: CategoryExpenseCardProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <Card>
      <CardHeader onClick={() => setExpanded(!expanded)}>
        <CategoryName>{name}</CategoryName>
        <CategoryInfo>
          <Count>{transactionCount} transactions</Count>
          <Amount>{formatAmount(totalAmount)}</Amount>
        </CategoryInfo>
      </CardHeader>
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
