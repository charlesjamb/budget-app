import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import styled from "styled-components";
import { Receipt, EyeOff, Eye, RotateCcw, X } from "lucide-react";
import { MonthPicker } from "../../components/MonthPicker.js";
import { useMonth } from "../../hooks/useMonth.js";
import {
  PageTitle,
  TitleRow,
  EmptyState,
  Button,
  SecondaryButton,
  Input,
  Label,
  Header,
} from "../../components/ui.js";
import {
  useTransactions,
  useExcludeTransaction,
  useSetReimbursement,
  useClearReimbursement,
} from "../../hooks/useTransactions.js";
import type { Transaction } from "@budget-app/shared";

const TableWrapper = styled.div`
  overflow-x: auto;
  background: ${(p) => p.theme.colors.card};
  border-radius: ${(p) => p.theme.radii.lg};
  box-shadow: ${(p) => p.theme.shadows.card};
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  min-width: 600px;
`;

const Th = styled.th`
  text-align: left;
  padding: 12px 16px;
  background: ${(p) => p.theme.colors.background};
  border-bottom: 1px solid ${(p) => p.theme.colors.border};
  font-size: 13px;
  white-space: nowrap;

  &:last-child {
    text-align: right;
  }
`;

const Td = styled.td<{ $excluded?: boolean }>`
  padding: 10px 16px;
  border-bottom: 1px solid ${(p) => p.theme.colors.border};
  font-size: 14px;
  text-align: right;
  white-space: nowrap;
  color: ${(p) => (p.$excluded ? p.theme.colors.textMuted : "inherit")};
  text-decoration: ${(p) => (p.$excluded ? "line-through" : "none")};

  &:first-child {
    text-align: left;
    font-weight: 500;
  }

  &:last-child {
    text-align: right;
  }
`;

const TdLabel = styled(Td)<{ $excluded?: boolean }>`
  font-weight: 500;
  color: ${(p) => (p.$excluded ? p.theme.colors.textMuted : "inherit")};
`;

const ActionButton = styled.button`
  background: none;
  border: none;
  color: ${(p) => p.theme.colors.textMuted};
  cursor: pointer;
  padding: 4px 8px;
  border-radius: ${(p) => p.theme.radii.sm};
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 13px;

  &:hover {
    background: ${(p) => p.theme.colors.background};
    color: ${(p) => p.theme.colors.primary};
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const ExcludedBadge = styled.span`
  font-size: 11px;
  color: ${(p) => p.theme.colors.textMuted};
  font-weight: 500;
  margin-left: 4px;
`;

const ReimbursedBadge = styled.span`
  font-size: 11px;
  color: ${(p) => p.theme.colors.success};
  font-weight: 500;
  margin-left: 4px;
`;

const OriginalAmount = styled.span`
  text-decoration: line-through;
  color: ${(p) => p.theme.colors.textMuted};
  font-size: 12px;
  margin-right: 6px;
`;

const ActionsCell = styled(Td)`
  text-decoration: none;
`;

const ModalOverlay = styled.div`
  position: fixed;
  inset: 0;
  background: ${(p) => p.theme.colors.overlay};
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 16px;
`;

const ModalContent = styled.div`
  background: ${(p) => p.theme.colors.card};
  border-radius: ${(p) => p.theme.radii.lg};
  box-shadow: ${(p) => p.theme.shadows.cardHover};
  padding: 24px;
  max-width: 400px;
  width: 100%;
`;

const ModalTitle = styled.h3`
  margin: 0 0 16px 0;
  font-size: 18px;
  font-weight: 600;
`;

const ModalDescription = styled.p`
  margin: 0 0 16px 0;
  font-size: 14px;
  color: ${(p) => p.theme.colors.textMuted};
`;

const ModalActions = styled.div`
  display: flex;
  gap: 12px;
  margin-top: 20px;
  justify-content: flex-end;
`;

function formatAmount(cents: number): string {
  return (cents / 100).toFixed(2) + " \u20AC";
}

function formatDate(dateStr: string): string {
  const [y, m, d] = dateStr.split("-");
  return `${d}/${m}/${y}`;
}

export const Route = createFileRoute("/_authenticated/transactions")({
  component: TransactionsPage,
});

function TransactionsPage() {
  const [month, setMonth] = useMonth();
  const [excludeModal, setExcludeModal] = useState<{
    transaction: Transaction;
    reason: string;
  } | null>(null);
  const [reimburseModal, setReimburseModal] = useState<{
    transaction: Transaction;
    amount: string;
    note: string;
  } | null>(null);

  const transactionsQuery = useTransactions(month);
  const excludeMutation = useExcludeTransaction();
  const reimburseMutation = useSetReimbursement();
  const clearReimburseMutation = useClearReimbursement();

  const transactions = transactionsQuery.data?.transactions ?? [];

  const handleExclude = (transaction: Transaction) => {
    setExcludeModal({
      transaction,
      reason: transaction.excludedReason ?? "",
    });
  };

  const handleUnExclude = (transaction: Transaction) => {
    excludeMutation.mutate({
      id: transaction.id,
      body: { excluded: false },
    });
  };

  const handleExcludeConfirm = () => {
    if (!excludeModal) return;
    excludeMutation.mutate(
      {
        id: excludeModal.transaction.id,
        body: {
          excluded: true,
          reason: excludeModal.reason.trim() || undefined,
        },
      },
      {
        onSuccess: () => setExcludeModal(null),
      },
    );
  };

  const handleExcludeCancel = () => {
    setExcludeModal(null);
  };

  const handleReimburse = (transaction: Transaction) => {
    setReimburseModal({
      transaction,
      amount: "",
      note: "",
    });
  };

  const handleReimburseConfirm = () => {
    if (!reimburseModal) return;
    const amountCents = Math.round(parseFloat(reimburseModal.amount) * 100);
    if (isNaN(amountCents) || amountCents <= 0) return;
    reimburseMutation.mutate(
      {
        id: reimburseModal.transaction.id,
        body: {
          amount: amountCents,
          note: reimburseModal.note.trim() || undefined,
        },
      },
      {
        onSuccess: () => setReimburseModal(null),
      },
    );
  };

  const handleReimburseCancel = () => {
    setReimburseModal(null);
  };

  const handleClearReimbursement = (transaction: Transaction) => {
    clearReimburseMutation.mutate(transaction.id);
  };

  return (
    <>
      <TitleRow>
        <Receipt size={28} strokeWidth={2} />
        <PageTitle>Transactions</PageTitle>
      </TitleRow>

      <Header>
        <MonthPicker month={month} onChange={setMonth} />
      </Header>

      {transactionsQuery.isLoading ? (
        <EmptyState>Loading...</EmptyState>
      ) : transactions.length === 0 ? (
        <EmptyState>No transactions for this month.</EmptyState>
      ) : (
        <TableWrapper>
          <Table>
            <thead>
              <tr>
                <Th>Date</Th>
                <Th>Label</Th>
                <Th>Category</Th>
                <Th>Amount</Th>
                <Th>Actions</Th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((tx) => (
                <tr key={tx.id}>
                  <Td $excluded={tx.excluded}>{formatDate(tx.dateOperation)}</Td>
                  <TdLabel $excluded={tx.excluded}>
                    {tx.displayName ?? tx.labelSimplified}
                    {tx.excluded && tx.excludedReason && (
                      <ExcludedBadge title={tx.excludedReason}>({tx.excludedReason})</ExcludedBadge>
                    )}
                    {tx.reimbursedAmount > 0 && tx.reimbursementNote && (
                      <ReimbursedBadge title={tx.reimbursementNote}>
                        ({tx.reimbursementNote})
                      </ReimbursedBadge>
                    )}
                  </TdLabel>
                  <Td $excluded={tx.excluded}>{tx.budgetCategoryName ?? "—"}</Td>
                  <Td $excluded={tx.excluded}>
                    {tx.reimbursedAmount > 0 ? (
                      <>
                        <OriginalAmount>{formatAmount(tx.amount)}</OriginalAmount>
                        {formatAmount(tx.amount - tx.reimbursedAmount)}
                      </>
                    ) : (
                      formatAmount(tx.amount)
                    )}
                  </Td>
                  <ActionsCell>
                    {tx.excluded ? (
                      <ActionButton
                        onClick={() => handleUnExclude(tx)}
                        disabled={excludeMutation.isPending}
                        title="Include in budget"
                      >
                        <Eye size={16} />
                        Include
                      </ActionButton>
                    ) : (
                      <>
                        <ActionButton
                          onClick={() => handleExclude(tx)}
                          disabled={excludeMutation.isPending}
                          title="Exclude from budget"
                        >
                          <EyeOff size={16} />
                          Exclude
                        </ActionButton>
                        {tx.reimbursedAmount > 0 ? (
                          <ActionButton
                            onClick={() => handleClearReimbursement(tx)}
                            disabled={clearReimburseMutation.isPending}
                            title="Clear reimbursement"
                          >
                            <X size={16} />
                            Clear
                          </ActionButton>
                        ) : (
                          <ActionButton
                            onClick={() => handleReimburse(tx)}
                            disabled={reimburseMutation.isPending}
                            title="Add reimbursement"
                          >
                            <RotateCcw size={16} />
                            Reimburse
                          </ActionButton>
                        )}
                      </>
                    )}
                  </ActionsCell>
                </tr>
              ))}
            </tbody>
          </Table>
        </TableWrapper>
      )}

      {excludeModal && (
        <ModalOverlay onClick={handleExcludeCancel}>
          <ModalContent onClick={(e) => e.stopPropagation()}>
            <ModalTitle>Exclude transaction</ModalTitle>
            <ModalDescription>
              "{excludeModal.transaction.displayName ?? excludeModal.transaction.labelSimplified}"
              will not count in your budget.
            </ModalDescription>
            <Label>
              Reason (optional)
              <Input
                type="text"
                placeholder="e.g. Reimbursed by bank"
                value={excludeModal.reason}
                onChange={(e) =>
                  setExcludeModal((prev) => (prev ? { ...prev, reason: e.target.value } : null))
                }
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleExcludeConfirm();
                  if (e.key === "Escape") handleExcludeCancel();
                }}
              />
            </Label>
            <ModalActions>
              <SecondaryButton onClick={handleExcludeCancel}>Cancel</SecondaryButton>
              <Button onClick={handleExcludeConfirm} disabled={excludeMutation.isPending}>
                {excludeMutation.isPending ? "Excluding..." : "Exclude"}
              </Button>
            </ModalActions>
          </ModalContent>
        </ModalOverlay>
      )}

      {reimburseModal && (
        <ModalOverlay onClick={handleReimburseCancel}>
          <ModalContent onClick={(e) => e.stopPropagation()}>
            <ModalTitle>Add reimbursement</ModalTitle>
            <ModalDescription>
              Transaction: "
              {reimburseModal.transaction.displayName ?? reimburseModal.transaction.labelSimplified}
              " ({formatAmount(reimburseModal.transaction.amount)})
            </ModalDescription>
            <Label>
              Reimbursed amount (EUR)
              <Input
                type="number"
                step="0.01"
                min="0.01"
                max={(reimburseModal.transaction.amount / 100).toFixed(2)}
                placeholder={`Max ${(reimburseModal.transaction.amount / 100).toFixed(2)}`}
                value={reimburseModal.amount}
                onChange={(e) =>
                  setReimburseModal((prev) => (prev ? { ...prev, amount: e.target.value } : null))
                }
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleReimburseConfirm();
                  if (e.key === "Escape") handleReimburseCancel();
                }}
              />
            </Label>
            <Label>
              Note (optional)
              <Input
                type="text"
                placeholder="e.g. Insurance reimbursement"
                value={reimburseModal.note}
                onChange={(e) =>
                  setReimburseModal((prev) => (prev ? { ...prev, note: e.target.value } : null))
                }
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleReimburseConfirm();
                  if (e.key === "Escape") handleReimburseCancel();
                }}
              />
            </Label>
            <ModalActions>
              <SecondaryButton onClick={handleReimburseCancel}>Cancel</SecondaryButton>
              <Button onClick={handleReimburseConfirm} disabled={reimburseMutation.isPending}>
                {reimburseMutation.isPending ? "Saving..." : "Save"}
              </Button>
            </ModalActions>
          </ModalContent>
        </ModalOverlay>
      )}
    </>
  );
}
