import { useState, useCallback, useMemo } from "react";
import { createFileRoute } from "@tanstack/react-router";
import styled from "styled-components";
import { MonthPicker } from "../../components/MonthPicker.js";
import { useMonth } from "../../hooks/useMonth.js";
import { ProgressBar } from "../../components/ProgressBar.js";
import { Wallet } from "lucide-react";
import {
  Button,
  SecondaryButton,
  AmountInput,
  Header,
  SaveStatus,
  EmptyState,
  PageTitle,
  TitleRow,
} from "../../components/ui.js";
import { useCategories } from "../../hooks/useCategories.js";
import { useMonthlySummary } from "../../hooks/useTransactions.js";
import { useBudgets, useUpsertBudgets, useCopyBudget } from "../../hooks/useBudgets.js";

const HeaderActions = styled.div`
  display: flex;
  gap: 8px;
  align-items: center;
`;

const GlobalCapSection = styled.div`
  background: ${(p) => p.theme.colors.card};
  border-radius: ${(p) => p.theme.radii.lg};
  box-shadow: ${(p) => p.theme.shadows.card};
  padding: 16px 20px;
  margin-bottom: 24px;
  border-left: 4px solid ${(p) => p.theme.colors.success};
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
  color: ${(p) => p.theme.colors.textMuted};
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
  color: ${(p) => p.theme.colors.textMuted};
`;

const GroupSubtotal = styled.span`
  font-size: 13px;
  color: ${(p) => p.theme.colors.textMuted};
`;

const CategoryList = styled.div`
  background: ${(p) => p.theme.colors.card};
  border-radius: ${(p) => p.theme.radii.lg};
  box-shadow: ${(p) => p.theme.shadows.card};
  overflow: hidden;
`;

const CategoryRow = styled.div`
  display: flex;
  align-items: center;
  padding: 12px 16px;
  border-bottom: 1px solid ${(p) => p.theme.colors.border};
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

const SpentAmount = styled.span`
  font-size: 13px;
  color: ${(p) => p.theme.colors.textMuted};
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

function formatAmount(cents: number): string {
  return (cents / 100).toFixed(2) + " \u20AC";
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
  const [month, setMonth] = useMonth();
  const [localBudgets, setLocalBudgets] = useState<Record<number, string>>({});
  const [dirty, setDirty] = useState(false);
  const [saved, setSaved] = useState(false);

  const categoriesQuery = useCategories();
  const summaryQuery = useMonthlySummary(month);
  const budgetsQuery = useBudgets(month);
  const upsertMutation = useUpsertBudgets();
  const copyMutation = useCopyBudget();

  const categories = useMemo(
    () => categoriesQuery.data?.categories ?? [],
    [categoriesQuery.data?.categories],
  );
  const summary = summaryQuery.data;

  const budgetMap = useMemo(
    () => new Map((budgetsQuery.data?.budgets ?? []).map((b) => [b.categoryId, b.amountCents])),
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
    const allCategoryIds = categories.map((c) => c.id);

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
  const spentMap = new Map((summary?.categories ?? []).map((c) => [c.id, c.totalAmount]));

  const groupedByType: Record<"fixed" | "variable", Record<string, GroupedCategory[]>> = {
    fixed: {},
    variable: {},
  };

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

  // Compute total budgeted from per-category budgets (same logic as backend)
  const totalBudgetedCents = useMemo(() => {
    return categories.reduce((sum, cat) => {
      const cents =
        localBudgets[cat.id] !== undefined
          ? Math.round(parseFloat(localBudgets[cat.id]) * 100) || 0
          : (budgetMap.get(cat.id) ?? 0);
      return sum + cents;
    }, 0);
  }, [categories, localBudgets, budgetMap]);

  if (categoriesQuery.isLoading || budgetsQuery.isLoading) {
    return <EmptyState>Loading...</EmptyState>;
  }

  return (
    <>
      <TitleRow>
        <Wallet size={28} strokeWidth={2} />
        <PageTitle>Budget</PageTitle>
      </TitleRow>

      <Header>
        <MonthPicker month={month} onChange={handleMonthChange} />
        <HeaderActions>
          <SecondaryButton onClick={handleCopy} disabled={copyMutation.isPending}>
            {copyMutation.isPending ? "Copying..." : `Copy from ${getPreviousMonth(month)}`}
          </SecondaryButton>
          <Button onClick={handleSave} disabled={!dirty || upsertMutation.isPending}>
            {upsertMutation.isPending ? "Saving..." : "Save"}
          </Button>
          {saved && <SaveStatus $success>Saved!</SaveStatus>}
        </HeaderActions>
      </Header>

      <GlobalCapSection>
        <GlobalCapRow>
          <GlobalCapLabel>Total budgeted</GlobalCapLabel>
          <SpentVsBudget>
            {formatAmount(totalBudgetedCents)} | Spent: {formatAmount(totalSpent)}
          </SpentVsBudget>
        </GlobalCapRow>
        {totalBudgetedCents > 0 && (
          <ProgressBar spent={totalSpent} budget={totalBudgetedCents} showLabel />
        )}
      </GlobalCapSection>

      {categories.length === 0 ? (
        <EmptyState>No categories yet. Create some in the Categories page first.</EmptyState>
      ) : (
        (["variable", "fixed"] as const)
          .filter((type) => Object.keys(groupedByType[type]).length > 0)
          .map((type) => {
            const groups = groupedByType[type];
            const groupNames = sortGroupNames(Object.keys(groups));

            const typeLabel = type === "fixed" ? "Fixed expenses" : "Variable expenses";
            return (
              <GroupSection key={type}>
                <GroupHeader>
                  <GroupTitle>{typeLabel}</GroupTitle>
                </GroupHeader>
                {groupNames.map((groupName) => {
                  const items = groups[groupName];
                  const groupSpent = items.reduce((s, c) => s + c.spent, 0);
                  const groupBudget = items.reduce((s, c) => s + c.budgetCents, 0);

                  return (
                    <GroupSection key={`${type}-${groupName || "_"}`}>
                      {groupName && (
                        <GroupHeader>
                          <GroupTitle>{groupName}</GroupTitle>
                          <GroupSubtotal>
                            {formatAmount(groupSpent)}
                            {groupBudget > 0 ? ` / ${formatAmount(groupBudget)}` : ""}
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
                              onChange={(e) => handleInputChange(cat.id, e.target.value)}
                            />
                            <ProgressWrapper>
                              {(budgetMap.get(cat.id) ?? 0) > 0 && (
                                <ProgressBar spent={cat.spent} budget={budgetMap.get(cat.id)!} />
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
