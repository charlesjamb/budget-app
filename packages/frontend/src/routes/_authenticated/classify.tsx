import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import styled from "styled-components";
import { Tags } from "lucide-react";
import { useUncategorizedSubcategories } from "../../hooks/useTransactions.js";
import { useCategories } from "../../hooks/useCategories.js";
import { useClassify } from "../../hooks/useMappingRules.js";
import type { UncategorizedGroup } from "@budget-app/shared";

import { PageTitle, TitleRow } from "../../components/ui.js";

const EmptyState = styled.div`
  text-align: center;
  padding: 48px;
  color: ${(p) => p.theme.colors.textMuted};
  font-size: 16px;
  background: ${(p) => p.theme.colors.card};
  border-radius: ${(p) => p.theme.radii.lg};
  box-shadow: ${(p) => p.theme.shadows.card};
`;

const CardList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

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

const CardHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  gap: 12px;
`;

const HeaderLeft = styled.button`
  display: flex;
  flex-direction: column;
  gap: 2px;
  background: none;
  border: none;
  cursor: pointer;
  text-align: left;
  padding: 0;
  flex: 1;
  min-width: 0;

  &:hover {
    opacity: 0.7;
  }
`;

const SubCategoryName = styled.span`
  font-weight: 600;
  font-size: 15px;
`;

const Count = styled.span`
  color: ${(p) => p.theme.colors.textMuted};
  font-size: 13px;
`;

const Select = styled.select`
  padding: 8px 12px;
  border: 1px solid ${(p) => p.theme.colors.borderLight};
  border-radius: ${(p) => p.theme.radii.md};
  font-size: 14px;
  min-width: 200px;
  flex-shrink: 0;
  background: ${(p) => p.theme.colors.card};

  &:focus {
    outline: none;
    border-color: ${(p) => p.theme.colors.primary};
    box-shadow: ${(p) => p.theme.shadows.focus};
  }
`;

const TransactionList = styled.div`
  border-top: 1px solid ${(p) => p.theme.colors.border};
  background: ${(p) => p.theme.colors.background};
`;

const TransactionRow = styled.div`
  display: flex;
  align-items: center;
  padding: 8px 20px;
  border-bottom: 1px solid ${(p) => p.theme.colors.border};
  font-size: 13px;
  gap: 12px;

  &:last-child {
    border-bottom: none;
  }
`;

const TxDate = styled.span`
  color: ${(p) => p.theme.colors.textMuted};
  min-width: 80px;
  flex-shrink: 0;
`;

const TxSublabel = styled.span`
  color: ${(p) => p.theme.colors.textLight};
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 12px;
`;

const TxAmount = styled.span`
  color: ${(p) => p.theme.colors.success};
  font-weight: 500;
  flex-shrink: 0;
  min-width: 80px;
  text-align: right;
`;

function formatDate(dateStr: string): string {
  const [y, m, d] = dateStr.split("-");
  return `${d}/${m}/${y}`;
}

function formatAmount(cents: number): string {
  return (cents / 100).toFixed(2) + " \u20AC";
}

export const Route = createFileRoute("/_authenticated/classify")({
  component: ClassifyPage,
});

function ClassifyPage() {
  const subcategoriesQuery = useUncategorizedSubcategories();
  const categoriesQuery = useCategories();
  const classifyMutation = useClassify();
  const [expandedSub, setExpandedSub] = useState<string | null>(null);

  const subcategories = subcategoriesQuery.data?.subcategories ?? [];
  const categories = categoriesQuery.data?.categories ?? [];

  const handleClassify = (
    bankSubCategory: string,
    labelSimplified: string,
    budgetCategoryId: number,
  ) => {
    classifyMutation.mutate({
      bankSubCategory,
      labelSimplified,
      budgetCategoryId,
    });
  };

  const groupKey = (sub: UncategorizedGroup) =>
    `${sub.bankSubCategory}::${sub.labelSimplified}`;

  const toggleExpand = (key: string) => {
    setExpandedSub((prev) => (prev === key ? null : key));
  };

  return (
    <>
      <TitleRow>
        <Tags size={28} strokeWidth={2} />
        <PageTitle>Classify Transactions</PageTitle>
      </TitleRow>

      {subcategories.length === 0 ? (
        <EmptyState>
          All transactions are classified! Nothing to do here.
        </EmptyState>
      ) : (
        <CardList>
          {subcategories.map((sub: UncategorizedGroup) => {
            const key = groupKey(sub);
            return (
              <Card key={key}>
                <CardHeader>
                  <HeaderLeft onClick={() => toggleExpand(key)}>
                    <SubCategoryName>{sub.labelSimplified}</SubCategoryName>
                    <Count>
                      {sub.bankSubCategory} &middot; {sub.count} transaction
                      {sub.count > 1 ? "s" : ""} &mdash; click to{" "}
                      {expandedSub === key ? "hide" : "show"} details
                    </Count>
                  </HeaderLeft>
                  <Select
                    defaultValue=""
                    onChange={(e) =>
                      handleClassify(
                        sub.bankSubCategory,
                        sub.labelSimplified,
                        parseInt(e.target.value, 10),
                      )
                    }
                    disabled={classifyMutation.isPending}
                  >
                    <option value="" disabled>
                      Select category...
                    </option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))}
                  </Select>
                </CardHeader>

                {expandedSub === key && (
                  <TransactionList>
                    {sub.transactions.map((tx) => (
                      <TransactionRow key={tx.id}>
                        <TxDate>{formatDate(tx.dateOperation)}</TxDate>
                        <TxSublabel>{tx.labelOperation}</TxSublabel>
                        <TxAmount>{formatAmount(tx.amount)}</TxAmount>
                      </TransactionRow>
                    ))}
                  </TransactionList>
                )}
              </Card>
            );
          })}
        </CardList>
      )}
    </>
  );
}
