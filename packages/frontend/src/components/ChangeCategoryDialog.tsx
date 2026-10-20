import { useState } from "react";
import styled from "styled-components";
import type { BudgetCategory, Transaction } from "@budget-app/shared";
import { useClassify } from "../hooks/useMappingRules.js";
import { useSetTransactionCategory } from "../hooks/useTransactions.js";
import { merchantName } from "../lib/transactions.js";
import {
  Button,
  Label,
  ModalActions,
  ModalContent,
  ModalDescription,
  ModalOverlay,
  ModalTitle,
  SecondaryButton,
  Select,
} from "./ui.js";

const Choices = styled.fieldset`
  border: none;
  margin: ${(p) => p.theme.space.lg} 0 0;
  display: flex;
  flex-direction: column;
  gap: ${(p) => p.theme.space.sm};
`;

const Choice = styled.label`
  display: flex;
  align-items: flex-start;
  gap: ${(p) => p.theme.space.sm};
  font-size: ${(p) => p.theme.fontSize.md};
  cursor: pointer;

  input {
    margin-top: 3px;
    accent-color: ${(p) => p.theme.colors.primary};
  }

  small {
    display: block;
    color: ${(p) => p.theme.colors.textMuted};
    font-size: ${(p) => p.theme.fontSize.sm};
  }
`;

type Scope = "rule" | "single";

interface ChangeCategoryDialogProps {
  transaction: Transaction;
  categories: BudgetCategory[];
  onClose: () => void;
}

/**
 * Re-categorises a transaction. By default this updates the mapping rule for the merchant
 * (all its non-manual transactions follow); "Just this one" overrides only this transaction.
 */
export function ChangeCategoryDialog({
  transaction,
  categories,
  onClose,
}: ChangeCategoryDialogProps) {
  const [categoryId, setCategoryId] = useState(
    transaction.budgetCategoryId !== null ? String(transaction.budgetCategoryId) : "",
  );
  const [scope, setScope] = useState<Scope>("rule");
  const classifyMutation = useClassify();
  const setCategoryMutation = useSetTransactionCategory();

  const merchant = merchantName(transaction);
  const isPending = classifyMutation.isPending || setCategoryMutation.isPending;

  const handleConfirm = () => {
    if (!categoryId) return;
    const budgetCategoryId = Number(categoryId);
    const options = { onSuccess: onClose };

    if (scope === "rule") {
      classifyMutation.mutate(
        {
          bankSubCategory: transaction.bankSubCategory,
          labelSimplified: transaction.labelSimplified,
          budgetCategoryId,
        },
        options,
      );
    } else {
      setCategoryMutation.mutate({ id: transaction.id, budgetCategoryId }, options);
    }
  };

  return (
    <ModalOverlay onClick={onClose}>
      <ModalContent
        role="dialog"
        aria-label="Change category"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => {
          if (e.key === "Escape") onClose();
        }}
      >
        <ModalTitle>Change category</ModalTitle>
        <ModalDescription>{merchant}</ModalDescription>
        <Label>
          Category
          <Select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} autoFocus>
            <option value="" disabled>
              Select category…
            </option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.icon ? `${c.icon} ` : ""}
                {c.name}
              </option>
            ))}
          </Select>
        </Label>
        <Choices>
          <Choice>
            <input
              type="radio"
              name="scope"
              checked={scope === "rule"}
              onChange={() => setScope("rule")}
            />
            <span>
              All “{merchant}” transactions
              <small>Updates the rule; manual overrides are kept.</small>
            </span>
          </Choice>
          <Choice>
            <input
              type="radio"
              name="scope"
              checked={scope === "single"}
              onChange={() => setScope("single")}
            />
            <span>Just this one</span>
          </Choice>
        </Choices>
        <ModalActions>
          <SecondaryButton type="button" onClick={onClose}>
            Cancel
          </SecondaryButton>
          <Button type="button" onClick={handleConfirm} disabled={!categoryId || isPending}>
            {isPending ? "Saving..." : "Save"}
          </Button>
        </ModalActions>
      </ModalContent>
    </ModalOverlay>
  );
}
