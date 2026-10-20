import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import styled from "styled-components";
import { Receipt, EyeOff, Eye, RotateCcw, X, Search, Tags, Lock } from "lucide-react";
import { MonthPicker } from "../../components/MonthPicker.js";
import { ChangeCategoryDialog } from "../../components/ChangeCategoryDialog.js";
import { RowMenu } from "../../components/RowMenu.js";
import { formatAmount } from "../../components/Amount.js";
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
  Card,
  Chip,
  Select,
  ModalActions,
  ModalContent,
  ModalDescription,
  ModalOverlay,
  ModalTitle,
} from "../../components/ui.js";
import {
  useTransactions,
  useExcludeTransaction,
  useSetReimbursement,
  useClearReimbursement,
} from "../../hooks/useTransactions.js";
import { useCategories } from "../../hooks/useCategories.js";
import {
  ALL_CATEGORIES_FILTER,
  UNCATEGORIZED_FILTER,
  filterTransactions,
  formatDayHeader,
  groupByDay,
  merchantName,
  effectiveAmount,
  totalSpent,
} from "../../lib/transactions.js";
import type { Transaction } from "@budget-app/shared";

const Toolbar = styled.div`
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: ${(p) => p.theme.space.md};
  padding: ${(p) => p.theme.space.md};
  margin-bottom: ${(p) => p.theme.space.lg};
  background: ${(p) => p.theme.colors.card};
  border: 1px solid ${(p) => p.theme.colors.border};
  border-radius: ${(p) => p.theme.radii.lg};
`;

const SearchBox = styled.div`
  flex: 1 1 200px;
  display: flex;
  align-items: center;
  gap: ${(p) => p.theme.space.sm};
  color: ${(p) => p.theme.colors.textMuted};
`;

const SearchInput = styled(Input)`
  flex: 1;
  min-width: 0;
`;

const FilterSelect = styled(Select)`
  min-width: 0;
  max-width: 100%;
`;

const Summary = styled.div`
  margin-left: auto;
  font-size: ${(p) => p.theme.fontSize.sm};
  color: ${(p) => p.theme.colors.textMuted};
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
`;

/* The row menu overflows the card, so it must not clip. */
const DayCard = styled(Card)`
  overflow: visible;
`;

const DayHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  margin: ${(p) => p.theme.space.xl} 0 ${(p) => p.theme.space.sm};

  h2 {
    font-size: ${(p) => p.theme.fontSize.xs};
    font-weight: 600;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    color: ${(p) => p.theme.colors.textMuted};
  }

  span {
    font-size: ${(p) => p.theme.fontSize.sm};
    color: ${(p) => p.theme.colors.textMuted};
    font-variant-numeric: tabular-nums;
  }
`;

const Row = styled.div<{ $excluded: boolean }>`
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto auto auto;
  grid-template-areas: "name chip amount menu";
  align-items: center;
  gap: ${(p) => p.theme.space.sm} ${(p) => p.theme.space.md};
  padding: ${(p) => p.theme.space.sm} ${(p) => p.theme.space.lg};
  border-bottom: 1px solid ${(p) => p.theme.colors.border};

  &:last-child {
    border-bottom: none;
  }

  &:hover [data-row-menu-trigger],
  &:focus-within [data-row-menu-trigger] {
    opacity: 1;
  }

  > [data-dimmable] {
    opacity: ${(p) => (p.$excluded ? 0.55 : 1)};
  }

  @media (max-width: 640px) {
    grid-template-columns: minmax(0, 1fr) auto auto;
    grid-template-areas:
      "name amount menu"
      "chip chip chip";
  }
`;

const NameCell = styled.div`
  grid-area: name;
  min-width: 0;
  display: flex;
  flex-direction: column;
`;

const Merchant = styled.span`
  font-size: ${(p) => p.theme.fontSize.md};
  font-weight: 500;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const SubLine = styled.span`
  font-size: ${(p) => p.theme.fontSize.xs};
  color: ${(p) => p.theme.colors.textMuted};
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const ChipCell = styled.div`
  grid-area: chip;
  justify-self: start;
  display: flex;
  align-items: center;
  gap: ${(p) => p.theme.space.xs};
`;

const ChipButton = styled(Chip)`
  cursor: pointer;
  border: none;
  font-family: inherit;

  &:hover {
    outline: 1px solid ${(p) => p.theme.colors.primary};
  }
`;

const AmountCell = styled.div`
  grid-area: amount;
  text-align: right;
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
  font-size: ${(p) => p.theme.fontSize.md};
`;

const OriginalAmount = styled.span`
  text-decoration: line-through;
  color: ${(p) => p.theme.colors.textMuted};
  font-size: ${(p) => p.theme.fontSize.xs};
  margin-right: 6px;
`;

const MenuCell = styled.div`
  grid-area: menu;
`;

export const Route = createFileRoute("/_authenticated/transactions")({
  component: TransactionsPage,
});

function TransactionsPage() {
  const [month, setMonth] = useMonth();
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState(ALL_CATEGORIES_FILTER);
  const [excludeModal, setExcludeModal] = useState<{
    transaction: Transaction;
    reason: string;
  } | null>(null);
  const [reimburseModal, setReimburseModal] = useState<{
    transaction: Transaction;
    amount: string;
    note: string;
  } | null>(null);
  const [categoryTransaction, setCategoryTransaction] = useState<Transaction | null>(null);

  const transactionsQuery = useTransactions(month);
  const categoriesQuery = useCategories();
  const excludeMutation = useExcludeTransaction();
  const reimburseMutation = useSetReimbursement();
  const clearReimburseMutation = useClearReimbursement();

  const transactions = useMemo(
    () => transactionsQuery.data?.transactions ?? [],
    [transactionsQuery.data?.transactions],
  );
  const categories = useMemo(
    () => categoriesQuery.data?.categories ?? [],
    [categoriesQuery.data?.categories],
  );

  const visible = useMemo(
    () => filterTransactions(transactions, { search, category: categoryFilter }),
    [transactions, search, categoryFilter],
  );
  const days = useMemo(() => groupByDay(visible), [visible]);
  const categoryIcons = useMemo(
    () => new Map(categories.map((c) => [c.id, c.icon ?? ""])),
    [categories],
  );

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

  const menuItemsFor = (tx: Transaction) => [
    tx.excluded
      ? {
          label: "Include",
          icon: <Eye size={16} />,
          onSelect: () => handleUnExclude(tx),
          disabled: excludeMutation.isPending,
        }
      : {
          label: "Exclude",
          icon: <EyeOff size={16} />,
          onSelect: () => handleExclude(tx),
          disabled: excludeMutation.isPending,
        },
    ...(tx.excluded
      ? []
      : [
          tx.reimbursedAmount > 0
            ? {
                label: "Clear reimbursement",
                icon: <X size={16} />,
                onSelect: () => handleClearReimbursement(tx),
                disabled: clearReimburseMutation.isPending,
              }
            : {
                label: "Reimburse",
                icon: <RotateCcw size={16} />,
                onSelect: () => handleReimburse(tx),
                disabled: reimburseMutation.isPending,
              },
        ]),
    {
      label: "Change category",
      icon: <Tags size={16} />,
      onSelect: () => setCategoryTransaction(tx),
    },
  ];

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
        <>
          <Toolbar>
            <SearchBox>
              <Search size={18} aria-hidden />
              <SearchInput
                type="search"
                aria-label="Search merchant"
                placeholder="Search merchant…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </SearchBox>
            <FilterSelect
              aria-label="Filter by category"
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
            >
              <option value={ALL_CATEGORIES_FILTER}>All categories</option>
              <option value={UNCATEGORIZED_FILTER}>Uncategorized</option>
              {categories.map((c) => (
                <option key={c.id} value={String(c.id)}>
                  {c.icon ? `${c.icon} ` : ""}
                  {c.name}
                </option>
              ))}
            </FilterSelect>
            <Summary aria-live="polite">
              {visible.length} · {formatAmount(-totalSpent(visible), { decimals: 0 })}
            </Summary>
          </Toolbar>

          {days.length === 0 ? (
            <EmptyState>No transactions match your filters.</EmptyState>
          ) : (
            days.map((day) => (
              <section key={day.date}>
                <DayHeader>
                  <h2>{formatDayHeader(day.date)}</h2>
                  <span>{formatAmount(-day.totalCents, { decimals: 0 })}</span>
                </DayHeader>
                <DayCard>
                  {day.transactions.map((tx) => {
                    const merchant = merchantName(tx);
                    const subLine = tx.excluded
                      ? tx.excludedReason
                      : tx.reimbursedAmount > 0
                        ? tx.reimbursementNote
                        : null;
                    const icon =
                      tx.budgetCategoryId !== null ? categoryIcons.get(tx.budgetCategoryId) : "";

                    return (
                      <Row key={tx.id} $excluded={tx.excluded}>
                        <NameCell data-dimmable>
                          <Merchant title={tx.labelOperation}>{merchant}</Merchant>
                          {subLine && <SubLine>{subLine}</SubLine>}
                        </NameCell>
                        <ChipCell data-dimmable>
                          <ChipButton
                            as="button"
                            type="button"
                            $tone={tx.budgetCategoryId === null ? "warn" : "neutral"}
                            aria-label={`Change category of ${merchant}`}
                            onClick={() => setCategoryTransaction(tx)}
                          >
                            {icon && <span aria-hidden>{icon}</span>}
                            {tx.budgetCategoryName ?? "Uncategorized"}
                            {tx.categoryLocked && <Lock size={11} aria-label="Set manually" />}
                          </ChipButton>
                          {tx.excluded && <Chip>excluded</Chip>}
                        </ChipCell>
                        <AmountCell data-dimmable>
                          {tx.reimbursedAmount > 0 && (
                            <OriginalAmount>{formatAmount(-tx.amount)}</OriginalAmount>
                          )}
                          {formatAmount(-effectiveAmount(tx))}
                        </AmountCell>
                        <MenuCell>
                          <RowMenu label={`Actions for ${merchant}`} items={menuItemsFor(tx)} />
                        </MenuCell>
                      </Row>
                    );
                  })}
                </DayCard>
              </section>
            ))
          )}
        </>
      )}

      {categoryTransaction && (
        <ChangeCategoryDialog
          transaction={categoryTransaction}
          categories={categories}
          onClose={() => setCategoryTransaction(null)}
        />
      )}

      {excludeModal && (
        <ModalOverlay onClick={handleExcludeCancel}>
          <ModalContent onClick={(e) => e.stopPropagation()}>
            <ModalTitle>Exclude transaction</ModalTitle>
            <ModalDescription>
              "{merchantName(excludeModal.transaction)}" will not count in your budget.
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
              Transaction: "{merchantName(reimburseModal.transaction)}" (
              {formatAmount(reimburseModal.transaction.amount)})
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
