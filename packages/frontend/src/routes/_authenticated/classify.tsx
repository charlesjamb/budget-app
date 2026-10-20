import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import styled from "styled-components";
import { Tags } from "lucide-react";
import type { BudgetCategory, UncategorizedGroup } from "@budget-app/shared";
import { useMonth } from "../../hooks/useMonth.js";
import { FlowSteps } from "../../components/FlowSteps.js";
import { formatAmount } from "../../components/Amount.js";
import { useUncategorizedSubcategories } from "../../hooks/useTransactions.js";
import { useCategories } from "../../hooks/useCategories.js";
import { useClassify, useMappingRules } from "../../hooks/useMappingRules.js";
import { orderQueue, suggestCategoryIds } from "../../lib/classify.js";
import { PageTitle, TitleRow, Card, SecondaryButton, SectionHeader } from "../../components/ui.js";

const Empty = styled.div`
  text-align: center;
  padding: 48px;
  color: ${(p) => p.theme.colors.textMuted};
  font-size: ${(p) => p.theme.fontSize.lg};
  background: ${(p) => p.theme.colors.card};
  border-radius: ${(p) => p.theme.radii.lg};
  box-shadow: ${(p) => p.theme.shadows.card};
`;

const Progress = styled.div`
  display: flex;
  align-items: center;
  gap: ${(p) => p.theme.space.md};
  margin-bottom: ${(p) => p.theme.space.lg};
  font-size: ${(p) => p.theme.fontSize.md};
  color: ${(p) => p.theme.colors.textMuted};
  font-variant-numeric: tabular-nums;
`;

const Track = styled.div`
  flex: 1;
  height: 6px;
  border-radius: ${(p) => p.theme.radii.pill};
  background: ${(p) => p.theme.colors.border};
  overflow: hidden;
`;

const Fill = styled.div<{ $ratio: number }>`
  height: 100%;
  width: ${(p) => Math.round(p.$ratio * 100)}%;
  background: ${(p) => p.theme.colors.primary};
`;

const MerchantCard = styled(Card)`
  padding: ${(p) => p.theme.space.xl};
`;

const Merchant = styled.h2`
  font-size: ${(p) => p.theme.fontSize.xxl};
  font-weight: 700;
  margin: 0;
`;

const Meta = styled.p`
  margin: ${(p) => p.theme.space.xs} 0 ${(p) => p.theme.space.lg};
  color: ${(p) => p.theme.colors.textMuted};
  font-size: ${(p) => p.theme.fontSize.md};
`;

const TransactionList = styled.div`
  border-top: 1px solid ${(p) => p.theme.colors.border};
`;

const TransactionRow = styled.div`
  display: flex;
  align-items: center;
  gap: ${(p) => p.theme.space.md};
  padding: ${(p) => p.theme.space.sm} 0;
  border-bottom: 1px solid ${(p) => p.theme.colors.border};
  font-size: ${(p) => p.theme.fontSize.sm};

  &:last-child {
    border-bottom: none;
  }
`;

const TxDate = styled.span`
  color: ${(p) => p.theme.colors.textMuted};
  min-width: 80px;
`;

const TxLabel = styled.span`
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: ${(p) => p.theme.colors.textLight};
`;

const TxAmount = styled.span`
  font-variant-numeric: tabular-nums;
  font-weight: 500;
`;

const Choices = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${(p) => p.theme.space.sm};
`;

const Choice = styled.button<{ $suggested?: boolean }>`
  display: inline-flex;
  align-items: center;
  gap: ${(p) => p.theme.space.xs};
  padding: 8px 14px;
  border-radius: ${(p) => p.theme.radii.pill};
  font-size: ${(p) => p.theme.fontSize.md};
  cursor: pointer;
  border: 1px solid ${(p) => (p.$suggested ? p.theme.colors.primary : p.theme.colors.borderLight)};
  background: ${(p) => (p.$suggested ? p.theme.colors.accentSoft : p.theme.colors.card)};
  color: ${(p) => (p.$suggested ? p.theme.colors.primary : p.theme.colors.text)};
  font-weight: ${(p) => (p.$suggested ? 600 : 400)};

  &:hover:not(:disabled) {
    border-color: ${(p) => p.theme.colors.primary};
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const Footer = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: ${(p) => p.theme.space.md};
  margin-top: ${(p) => p.theme.space.lg};
  color: ${(p) => p.theme.colors.textMuted};
  font-size: ${(p) => p.theme.fontSize.sm};
`;

function formatDate(dateStr: string): string {
  const [y, m, d] = dateStr.split("-");
  return `${d}/${m}/${y}`;
}

const groupKey = (sub: UncategorizedGroup) => `${sub.bankSubCategory}::${sub.labelSimplified}`;

export const Route = createFileRoute("/_authenticated/classify")({
  component: ClassifyPage,
});

function ClassifyPage() {
  const [month] = useMonth();
  const subcategoriesQuery = useUncategorizedSubcategories();
  const categoriesQuery = useCategories();
  const rulesQuery = useMappingRules();
  const classifyMutation = useClassify();
  const [skipped, setSkipped] = useState<string[]>([]);
  const [doneCount, setDoneCount] = useState(0);

  const queue = useMemo(
    () => orderQueue(subcategoriesQuery.data?.subcategories ?? [], groupKey, skipped),
    [subcategoriesQuery.data?.subcategories, skipped],
  );
  const categories = useMemo(
    () => categoriesQuery.data?.categories ?? [],
    [categoriesQuery.data?.categories],
  );
  const current = queue[0];

  const suggested = useMemo(() => {
    if (!current) return [];
    const byId = new Map(categories.map((c) => [c.id, c]));
    return suggestCategoryIds(rulesQuery.data?.rules ?? [], current.bankSubCategory)
      .map((id) => byId.get(id))
      .filter((c): c is BudgetCategory => c !== undefined);
  }, [current, categories, rulesQuery.data?.rules]);

  const handleClassify = (budgetCategoryId: number) => {
    if (!current) return;
    classifyMutation.mutate(
      {
        bankSubCategory: current.bankSubCategory,
        labelSimplified: current.labelSimplified,
        budgetCategoryId,
      },
      { onSuccess: () => setDoneCount((n) => n + 1) },
    );
  };

  const handleSkip = () => {
    if (!current) return;
    const key = groupKey(current);
    setSkipped((prev) => [...prev.filter((k) => k !== key), key]);
  };

  const total = doneCount + queue.length;
  const suggestedIds = new Set(suggested.map((c) => c.id));

  return (
    <>
      <TitleRow>
        <Tags size={28} strokeWidth={2} />
        <PageTitle>Classify</PageTitle>
      </TitleRow>

      <FlowSteps flow="close" current="/classify" month={month} />

      {!current ? (
        <Empty>All transactions are classified! Nothing to do here.</Empty>
      ) : (
        <>
          <Progress>
            <span>
              {doneCount + 1} / {total}
            </span>
            <Track>
              <Fill $ratio={doneCount / total} />
            </Track>
          </Progress>

          <MerchantCard>
            <Merchant>{current.labelSimplified}</Merchant>
            <Meta>
              {current.bankSubCategory} &middot; {current.count} transaction
              {current.count > 1 ? "s" : ""}
            </Meta>
            <TransactionList>
              {current.transactions.map((tx) => (
                <TransactionRow key={tx.id}>
                  <TxDate>{formatDate(tx.dateOperation)}</TxDate>
                  <TxLabel>{tx.labelOperation}</TxLabel>
                  <TxAmount>{formatAmount(tx.amount)}</TxAmount>
                </TransactionRow>
              ))}
            </TransactionList>

            {suggested.length > 0 && (
              <>
                <SectionHeader>Suggested</SectionHeader>
                <Choices>
                  {suggested.map((cat) => (
                    <Choice
                      key={cat.id}
                      $suggested
                      disabled={classifyMutation.isPending}
                      onClick={() => handleClassify(cat.id)}
                    >
                      {cat.icon && <span aria-hidden>{cat.icon}</span>}
                      {cat.name}
                    </Choice>
                  ))}
                </Choices>
              </>
            )}

            <SectionHeader>
              {suggested.length > 0 ? "All categories" : "Choose a category"}
            </SectionHeader>
            <Choices>
              {categories
                .filter((cat) => !suggestedIds.has(cat.id))
                .map((cat) => (
                  <Choice
                    key={cat.id}
                    disabled={classifyMutation.isPending}
                    onClick={() => handleClassify(cat.id)}
                  >
                    {cat.icon && <span aria-hidden>{cat.icon}</span>}
                    {cat.name}
                  </Choice>
                ))}
            </Choices>
          </MerchantCard>

          <Footer>
            <span>
              A rule is saved so future imports of this merchant are classified automatically.
            </span>
            {queue.length > 1 && <SecondaryButton onClick={handleSkip}>Skip</SecondaryButton>}
          </Footer>
        </>
      )}
    </>
  );
}
