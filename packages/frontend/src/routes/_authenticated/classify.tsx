import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import styled from "styled-components";
import { useUncategorizedSubcategories } from "../../hooks/useTransactions.js";
import { useCategories } from "../../hooks/useCategories.js";
import { useClassify } from "../../hooks/useMappingRules.js";
import type { UncategorizedGroup } from "@budget-app/shared";

const Title = styled.h1`
  font-size: 24px;
  margin-bottom: 24px;
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 48px;
  color: #6b7280;
  font-size: 16px;
  background: #fff;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
`;

const CardList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const Card = styled.div`
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  overflow: hidden;
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
  color: #6b7280;
  font-size: 13px;
`;

const Select = styled.select`
  padding: 8px 12px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 14px;
  min-width: 200px;
  flex-shrink: 0;
`;

const TransactionList = styled.div`
  border-top: 1px solid #e5e7eb;
  background: #fafafa;
`;

const TransactionRow = styled.div`
  display: flex;
  align-items: center;
  padding: 8px 20px;
  border-bottom: 1px solid #f0f0f0;
  font-size: 13px;
  gap: 12px;

  &:last-child {
    border-bottom: none;
  }
`;

const TxDate = styled.span`
  color: #6b7280;
  min-width: 80px;
  flex-shrink: 0;
`;

const TxSublabel = styled.span`
  color: #9ca3af;
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 12px;
`;

const TxAmount = styled.span`
  color: #059669;
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
      <Title>✅ Classify Transactions</Title>

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
