import { useState, useCallback, useMemo } from "react";
import { createFileRoute } from "@tanstack/react-router";
import styled from "styled-components";
import { GLOBAL_CAP_CATEGORY_ID } from "@budget-app/shared";
import { MonthPicker } from "../../components/MonthPicker.js";
import { ProgressBar } from "../../components/ProgressBar.js";
import { useCategories } from "../../hooks/useCategories.js";
import { useMonthlySummary } from "../../hooks/useTransactions.js";
import {
  useBudgets,
  useUpsertBudgets,
  useCopyBudget,
} from "../../hooks/useBudgets.js";

const PageTitle = styled.h1`
  font-size: 24px;
  margin-bottom: 20px;
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  flex-wrap: wrap;
  gap: 12px;
`;

const HeaderActions = styled.div`
  display: flex;
  gap: 8px;
  align-items: center;
`;

const Button = styled.button`
  background: #1a1a2e;
  color: #fff;
  border: none;
  padding: 8px 16px;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;

  &:hover {
    background: #16213e;
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const SecondaryButton = styled.button`
  background: #fff;
  color: #1a1a2e;
  border: 1px solid #d1d5db;
  padding: 8px 16px;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;

  &:hover {
    background: #f9fafb;
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const GlobalCapSection = styled.div`
  background: #fff;
  border: 1px solid #e5e7eb;
  border-left: 4px solid #059669;
  border-radius: 8px;
  padding: 16px 20px;
  margin-bottom: 24px;
`;

const GlobalCapRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
  margin-bottom: 8px;
`;

const GlobalCapLabel = styled.span`
  font-weight: 600;
  font-size: 16px;
`;

const SpentVsBudget = styled.span`
  font-size: 14px;
  color: #6b7280;
`;

const GroupSection = styled.div`
  margin-bottom: 24px;
`;

const GroupHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  margin-bottom: 8px;
`;

const GroupTitle = styled.h2`
  font-size: 14px;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: #6b7280;
`;

const GroupSubtotal = styled.span`
  font-size: 13px;
  color: #6b7280;
`;

const CategoryList = styled.div`
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  overflow: hidden;
`;

const CategoryRow = styled.div`
  display: flex;
  align-items: center;
  padding: 12px 16px;
  border-bottom: 1px solid #f3f4f6;
  gap: 12px;

  &:last-child {
    border-bottom: none;
  }

  @media (max-width: 640px) {
    flex-wrap: wrap;
  }
`;

const CategoryName = styled.span`
  font-size: 15px;
  flex: 1;
  min-width: 120px;
`;

const AmountInput = styled.input`
  width: 100px;
  padding: 6px 8px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 14px;
  text-align: right;

  &:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.2);
  }
`;

const SpentAmount = styled.span`
  font-size: 13px;
  color: #6b7280;
  width: 90px;
  text-align: right;
  flex-shrink: 0;
`;

const ProgressWrapper = styled.div`
  width: 120px;
  flex-shrink: 0;

  @media (max-width: 640px) {
    width: 100%;
  }
`;

const EmptyState = styled.p`
  text-align: center;
  color: #6b7280;
  padding: 48px 0;
  font-size: 16px;
`;

const SaveStatus = styled.span<{ $success?: boolean }>`
  font-size: 13px;
  color: ${(p) => (p.$success ? "#059669" : "#6b7280")};
`;

function formatAmount(cents: number): string {
  return (cents / 100).toFixed(2) + " \u20AC";
}

function getCurrentMonth(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

function getPreviousMonth(month: string): string {
  const [y, m] = month.split("-").map(Number);
  const date = new Date(y, m - 2, 1);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

interface GroupedCategory {
  id: number;
  name: string;
  groupName: string;
  type: "fixed" | "variable";
  spent: number;
  budgetCents: number;
}

export const Route = createFileRoute("/_authenticated/budget")({
  component: BudgetPage,
});

function BudgetPage() {
  const [month, setMonth] = useState(getCurrentMonth);
  const [localBudgets, setLocalBudgets] = useState<Record<number, string>>({});
  const [dirty, setDirty] = useState(false);
  const [saved, setSaved] = useState(false);

  const categoriesQuery = useCategories();
  const summaryQuery = useMonthlySummary(month);
  const budgetsQuery = useBudgets(month);
  const upsertMutation = useUpsertBudgets();
  const copyMutation = useCopyBudget();

  const categories = categoriesQuery.data?.categories ?? [];
  const summary = summaryQuery.data;

  const budgetMap = useMemo(
    () =>
      new Map(
        (budgetsQuery.data?.budgets ?? []).map((b) => [
          b.categoryId,
          b.amountCents,
        ]),
      ),
    [budgetsQuery.data?.budgets],
  );

  const getInputValue = useCallback(
    (categoryId: number): string => {
      if (localBudgets[categoryId] !== undefined) {
        return localBudgets[categoryId];
      }
      const serverValue = budgetMap.get(categoryId);
      return serverValue ? (serverValue / 100).toFixed(2) : "";
    },
    [localBudgets, budgetMap],
  );

  const handleInputChange = (categoryId: number, value: string) => {
    setLocalBudgets((prev) => ({ ...prev, [categoryId]: value }));
    setDirty(true);
    setSaved(false);
  };

  const handleMonthChange = (newMonth: string) => {
    setMonth(newMonth);
    setLocalBudgets({});
    setDirty(false);
    setSaved(false);
  };

  const handleSave = () => {
    const budgets: { categoryId: number; amountCents: number }[] = [];

    // Collect all category IDs that need updating
    const allCategoryIds = [
      GLOBAL_CAP_CATEGORY_ID,
      ...categories.map((c) => c.id),
    ];

    for (const catId of allCategoryIds) {
      if (localBudgets[catId] !== undefined) {
        const parsed = parseFloat(localBudgets[catId]);
        const amountCents = isNaN(parsed) ? 0 : Math.round(parsed * 100);
        budgets.push({ categoryId: catId, amountCents });
      }
    }

    if (budgets.length === 0) return;

    upsertMutation.mutate(
      { month, budgets },
      {
        onSuccess: () => {
          setLocalBudgets({});
          setDirty(false);
          setSaved(true);
        },
      },
    );
  };

  const handleCopy = () => {
    const sourceMonth = getPreviousMonth(month);
    copyMutation.mutate(
      { sourceMonth, targetMonth: month },
      {
        onSuccess: () => {
          setLocalBudgets({});
          setDirty(false);
          setSaved(false);
        },
      },
    );
  };

  // Build grouped categories: first by type (fixed, variable), then by groupName
  const spentMap = new Map(
    (summary?.categories ?? []).map((c) => [c.id, c.totalAmount]),
  );

  const groupedByType: Record<
    "fixed" | "variable",
    Record<string, GroupedCategory[]>
  > = { fixed: {}, variable: {} };

  for (const cat of categories) {
    const type = cat.type ?? "variable";
    const group = cat.groupName?.trim() || "";
    if (!groupedByType[type][group]) groupedByType[type][group] = [];
    groupedByType[type][group].push({
      id: cat.id,
      name: cat.name,
      groupName: group,
      type,
      spent: spentMap.get(cat.id) ?? 0,
      budgetCents: budgetMap.get(cat.id) ?? 0,
    });
  }

  const sortGroupNames = (names: string[]) =>
    names.sort((a, b) => {
      if (a === "") return 1;
      if (b === "") return -1;
      return a.localeCompare(b);
    });

  const totalSpent = summary?.totalAmount ?? 0;
  const globalCapCents = budgetMap.get(GLOBAL_CAP_CATEGORY_ID) ?? 0;

  if (categoriesQuery.isLoading || budgetsQuery.isLoading) {
    return <EmptyState>Loading...</EmptyState>;
  }

  return (
    <>
      <PageTitle>📊 Budget</PageTitle>

      <Header>
        <MonthPicker month={month} onChange={handleMonthChange} />
        <HeaderActions>
          <SecondaryButton
            onClick={handleCopy}
            disabled={copyMutation.isPending}
          >
            {copyMutation.isPending
              ? "Copying..."
              : `Copy from ${getPreviousMonth(month)}`}
          </SecondaryButton>
          <Button
            onClick={handleSave}
            disabled={!dirty || upsertMutation.isPending}
          >
            {upsertMutation.isPending ? "Saving..." : "Save"}
          </Button>
          {saved && <SaveStatus $success>Saved!</SaveStatus>}
        </HeaderActions>
      </Header>

      <GlobalCapSection>
        <GlobalCapRow>
          <GlobalCapLabel>Global monthly cap</GlobalCapLabel>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <SpentVsBudget>Spent: {formatAmount(totalSpent)}</SpentVsBudget>
            <AmountInput
              type="text"
              inputMode="decimal"
              placeholder="0.00"
              value={getInputValue(GLOBAL_CAP_CATEGORY_ID)}
              onChange={(e) =>
                handleInputChange(GLOBAL_CAP_CATEGORY_ID, e.target.value)
              }
            />
          </div>
        </GlobalCapRow>
        {globalCapCents > 0 && (
          <ProgressBar spent={totalSpent} budget={globalCapCents} showLabel />
        )}
      </GlobalCapSection>

      {categories.length === 0 ? (
        <EmptyState>
          No categories yet. Create some in the Categories page first.
        </EmptyState>
      ) : (
        (["variable", "fixed"] as const)
          .filter((type) => Object.keys(groupedByType[type]).length > 0)
          .map((type) => {
            const groups = groupedByType[type];
            const groupNames = sortGroupNames(Object.keys(groups));

            const typeLabel =
              type === "fixed" ? "Fixed expenses" : "Variable expenses";
            return (
              <GroupSection key={type}>
                <GroupHeader>
                  <GroupTitle>{typeLabel}</GroupTitle>
                </GroupHeader>
                {groupNames.map((groupName) => {
                  const items = groups[groupName];
                  const groupSpent = items.reduce((s, c) => s + c.spent, 0);
                  const groupBudget = items.reduce(
                    (s, c) => s + c.budgetCents,
                    0,
                  );

                  return (
                    <GroupSection key={`${type}-${groupName || "_"}`}>
                      {groupName && (
                        <GroupHeader>
                          <GroupTitle>{groupName}</GroupTitle>
                          <GroupSubtotal>
                            {formatAmount(groupSpent)}
                            {groupBudget > 0
                              ? ` / ${formatAmount(groupBudget)}`
                              : ""}
                          </GroupSubtotal>
                        </GroupHeader>
                      )}
                      <CategoryList>
                        {items.map((cat) => (
                          <CategoryRow key={cat.id}>
                            <CategoryName>{cat.name}</CategoryName>
                            <SpentAmount>{formatAmount(cat.spent)}</SpentAmount>
                            <AmountInput
                              type="text"
                              inputMode="decimal"
                              placeholder="0.00"
                              value={getInputValue(cat.id)}
                              onChange={(e) =>
                                handleInputChange(cat.id, e.target.value)
                              }
                            />
                            <ProgressWrapper>
                              {(budgetMap.get(cat.id) ?? 0) > 0 && (
                                <ProgressBar
                                  spent={cat.spent}
                                  budget={budgetMap.get(cat.id)!}
                                />
                              )}
                            </ProgressWrapper>
                          </CategoryRow>
                        ))}
                      </CategoryList>
                    </GroupSection>
                  );
                })}
              </GroupSection>
            );
          })
      )}
    </>
  );
}
