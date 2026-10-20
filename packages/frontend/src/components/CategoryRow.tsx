import { useState } from "react";
import styled from "styled-components";
import type { CategoryType, Transaction } from "@budget-app/shared";
import { formatAmount } from "./Amount.js";
import { ProgressBar } from "./ProgressBar.js";
import { getBudgetStatus } from "../lib/budget-status.js";

const Row = styled.div`
  border-bottom: 1px solid ${(p) => p.theme.colors.border};

  &:last-child {
    border-bottom: none;
  }
`;

const RowButton = styled.button`
  width: 100%;
  display: grid;
  grid-template-columns: 1fr auto;
  align-items: center;
  gap: 6px ${(p) => p.theme.space.md};
  padding: ${(p) => p.theme.space.md} ${(p) => p.theme.space.lg};
  background: transparent;
  color: ${(p) => p.theme.colors.text};
  border: none;
  cursor: pointer;
  text-align: left;
  font-size: ${(p) => p.theme.fontSize.md};

  &:hover {
    background: ${(p) => p.theme.colors.background};
  }
`;

const Name = styled.span`
  display: inline-flex;
  align-items: center;
  gap: ${(p) => p.theme.space.sm};
  min-width: 0;
  font-weight: 600;
`;

const Figures = styled.span`
  display: inline-flex;
  align-items: baseline;
  gap: ${(p) => p.theme.space.md};
  justify-self: end;
  white-space: nowrap;
  font-variant-numeric: tabular-nums;
`;

const Spent = styled.span`
  font-weight: 600;
`;

const Budget = styled.span`
  color: ${(p) => p.theme.colors.textMuted};
`;

const Remaining = styled.span<{ $tone: "ok" | "warn" | "over" | "muted" }>`
  min-width: 84px;
  text-align: right;
  font-size: ${(p) => p.theme.fontSize.sm};
  color: ${(p) =>
    p.$tone === "over"
      ? p.theme.colors.over
      : p.$tone === "warn"
        ? p.theme.colors.warn
        : p.$tone === "ok"
          ? p.theme.colors.ok
          : p.theme.colors.textMuted};
`;

const Count = styled.span`
  min-width: 24px;
  text-align: right;
  color: ${(p) => p.theme.colors.textLight};
  font-size: ${(p) => p.theme.fontSize.xs};
`;

const BarSlot = styled.div`
  grid-column: 1 / -1;
`;

const TransactionList = styled.div`
  border-top: 1px solid ${(p) => p.theme.colors.border};
  background: ${(p) => p.theme.colors.background};
`;

const TransactionRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px ${(p) => p.theme.space.lg};
  font-size: ${(p) => p.theme.fontSize.sm};
  min-width: 0;
`;

const TransactionDate = styled.span`
  color: ${(p) => p.theme.colors.textMuted};
  min-width: 80px;
  flex-shrink: 0;
`;

const TransactionLabel = styled.span`
  flex: 1;
  margin: 0 ${(p) => p.theme.space.md};
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  min-width: 0;
`;

const TransactionAmount = styled.span`
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
`;

const OriginalAmount = styled.span`
  text-decoration: line-through;
  color: ${(p) => p.theme.colors.textMuted};
  font-size: ${(p) => p.theme.fontSize.xs};
  margin-right: 6px;
`;

const ReimbursedIndicator = styled.span`
  font-size: ${(p) => p.theme.fontSize.xs};
  color: ${(p) => p.theme.colors.ok};
  margin-left: 4px;
`;

function formatDate(dateStr: string): string {
  const [y, m, d] = dateStr.split("-");
  return `${d}/${m}/${y}`;
}

interface CategoryRowProps {
  name: string;
  icon?: string | null;
  type?: CategoryType;
  totalAmount: number;
  transactionCount: number;
  transactions: Transaction[];
  budgetAmountCents?: number;
}

/** One compact category line; click to expand the underlying transactions. */
export function CategoryRow({
  name,
  icon,
  type = "variable",
  totalAmount,
  transactionCount,
  transactions,
  budgetAmountCents,
}: CategoryRowProps) {
  const [expanded, setExpanded] = useState(false);
  const status = getBudgetStatus(totalAmount, budgetAmountCents, type);
  const budget = budgetAmountCents ?? 0;
  const diff = budget - totalAmount;

  const remaining =
    status === "over"
      ? { text: `+${formatAmount(-diff, { decimals: 0 })} over`, tone: "over" as const }
      : status === "paid"
        ? { text: "paid ✓", tone: "ok" as const }
        : status === "unbudgeted"
          ? null
          : {
              text: `${formatAmount(diff, { decimals: 0 })} left`,
              tone: status === "warn" ? ("warn" as const) : ("muted" as const),
            };

  return (
    <Row>
      <RowButton type="button" onClick={() => setExpanded(!expanded)} aria-expanded={expanded}>
        <Name>
          {icon && <span aria-hidden>{icon}</span>}
          {name}
        </Name>
        <Figures>
          <span>
            <Spent>{formatAmount(totalAmount, { decimals: 0 })}</Spent>
            {budget > 0 && <Budget> / {formatAmount(budget, { decimals: 0 })}</Budget>}
          </span>
          {remaining && <Remaining $tone={remaining.tone}>{remaining.text}</Remaining>}
          <Count title={`${transactionCount} transactions`}>{transactionCount}</Count>
        </Figures>
        {budget > 0 && (
          <BarSlot>
            <ProgressBar spent={totalAmount} budget={budget} status={status} />
          </BarSlot>
        )}
      </RowButton>
      {expanded && (
        <TransactionList>
          {transactions.map((tx) => (
            <TransactionRow key={tx.id}>
              <TransactionDate>{formatDate(tx.dateOperation)}</TransactionDate>
              <TransactionLabel>{tx.displayName || tx.labelSimplified}</TransactionLabel>
              <TransactionAmount>
                {tx.reimbursedAmount > 0 && (
                  <OriginalAmount>{formatAmount(tx.amount)}</OriginalAmount>
                )}
                {formatAmount(tx.amount - tx.reimbursedAmount)}
                {tx.reimbursedAmount > 0 && (
                  <ReimbursedIndicator title={tx.reimbursementNote ?? "Reimbursed"}>
                    *
                  </ReimbursedIndicator>
                )}
              </TransactionAmount>
            </TransactionRow>
          ))}
        </TransactionList>
      )}
    </Row>
  );
}
