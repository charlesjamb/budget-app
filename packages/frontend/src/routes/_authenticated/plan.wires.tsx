import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import styled from "styled-components";
import { Scale } from "lucide-react";
import { MonthPicker } from "../../components/MonthPicker.js";
import { FlowSteps } from "../../components/FlowSteps.js";
import { formatAmount } from "../../components/Amount.js";
import {
  Section,
  SectionTitle,
  MemberLine,
  MemberLabel,
  Figure,
  Note,
} from "../../components/split-ui.js";
import { useMonth } from "../../hooks/useMonth.js";
import { useSplitComputation } from "../../hooks/useSplitComputation.js";
import { useContributions, useUpsertContributions } from "../../hooks/useContributions.js";
import { addMonths } from "../../lib/month.js";
import { parseAmountToCents } from "../../lib/budget-plan.js";
import { memberName } from "../../lib/members.js";
import {
  SecondaryButton,
  AmountInput,
  Chip,
  EmptyState,
  Header,
  PageTitle,
  TitleRow,
} from "../../components/ui.js";

const IncomeField = styled.div`
  display: flex;
  align-items: center;
  gap: ${(p) => p.theme.space.sm};

  input {
    width: 120px;
  }
`;

const Share = styled(Chip)`
  min-width: 48px;
  justify-content: center;
`;

const Prompt = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: ${(p) => p.theme.space.md};
  margin-bottom: ${(p) => p.theme.space.xl};
  color: ${(p) => p.theme.colors.textMuted};
`;

function monthName(month: string): string {
  const [y, m] = month.split("-").map(Number);
  return new Date(y, m - 1, 1).toLocaleString("en-US", { month: "long" });
}

export const Route = createFileRoute("/_authenticated/plan/wires")({
  component: WiresPage,
});

function WiresPage() {
  const [month, setMonth] = useMonth();
  const prevMonth = addMonths(month, -1);
  const [localRevenues, setLocalRevenues] = useState<Record<number, string>>({});

  const upsertMutation = useUpsertContributions();
  const prevQuery = useContributions(prevMonth);
  const { isLoading, members, totalRevenueCents, ratios, totalBudgetedCents, wireAmounts } =
    useSplitComputation(month, localRevenues);

  const dropLocal = (userId: number) =>
    setLocalRevenues((prev) => {
      const { [userId]: _removed, ...rest } = prev;
      return rest;
    });

  const inputValue = (userId: number): string => {
    if (localRevenues[userId] !== undefined) return localRevenues[userId];
    const saved = members.find((m) => m.userId === userId)?.revenueCents ?? 0;
    return saved ? (saved / 100).toFixed(2) : "";
  };

  const handleBlur = (userId: number) => {
    if (localRevenues[userId] === undefined) return;
    const revenueCents = parseAmountToCents(localRevenues[userId]);
    const saved = members.find((m) => m.userId === userId)?.revenueCents ?? 0;
    if (revenueCents === saved) {
      dropLocal(userId);
      return;
    }
    upsertMutation.mutate(
      { month, contributions: [{ userId, revenueCents }] },
      { onSuccess: () => dropLocal(userId) },
    );
  };

  const prevRevenues = (prevQuery.data?.members ?? []).filter((m) => m.revenueCents > 0);

  const handleCarryOver = () => {
    upsertMutation.mutate({
      month,
      contributions: prevRevenues.map((m) => ({ userId: m.userId, revenueCents: m.revenueCents })),
    });
  };

  if (isLoading) {
    return <EmptyState>Loading...</EmptyState>;
  }

  return (
    <>
      <TitleRow>
        <Scale size={28} strokeWidth={2} />
        <PageTitle>Wires</PageTitle>
      </TitleRow>

      <FlowSteps flow="plan" current="/plan/wires" month={month} />

      <Header>
        <MonthPicker
          month={month}
          onChange={(next) => {
            setMonth(next);
            setLocalRevenues({});
          }}
        />
      </Header>

      {members.length === 0 ? (
        <EmptyState>No household members found. Add members in Settings.</EmptyState>
      ) : (
        <>
          <Section>
            <SectionTitle>Revenue</SectionTitle>
            {members.map((m) => (
              <MemberLine key={m.userId}>
                <MemberLabel>{memberName(m)}</MemberLabel>
                <IncomeField>
                  <AmountInput
                    type="text"
                    inputMode="decimal"
                    placeholder="0.00"
                    aria-label={`${memberName(m)} revenue`}
                    value={inputValue(m.userId)}
                    onChange={(e) =>
                      setLocalRevenues((prev) => ({ ...prev, [m.userId]: e.target.value }))
                    }
                    onBlur={() => handleBlur(m.userId)}
                  />
                  <span>€</span>
                  {totalRevenueCents > 0 && (
                    <Share>{Math.round((ratios.get(m.userId) ?? 0) * 100)}%</Share>
                  )}
                </IncomeField>
              </MemberLine>
            ))}
          </Section>

          {totalRevenueCents === 0 ? (
            <Prompt>
              <span>Enter your incomes to compute wires.</span>
              {prevRevenues.length > 0 && (
                <SecondaryButton onClick={handleCarryOver} disabled={upsertMutation.isPending}>
                  Use {monthName(prevMonth)}&rsquo;s incomes
                </SecondaryButton>
              )}
            </Prompt>
          ) : (
            <Section>
              <SectionTitle>
                To wire for {monthName(month)} ({formatAmount(totalBudgetedCents)})
              </SectionTitle>
              {totalBudgetedCents === 0 && <Note>No budget planned yet for this month.</Note>}
              {members.map((m) => (
                <MemberLine key={m.userId}>
                  <MemberLabel>➜ {memberName(m)}</MemberLabel>
                  <Figure>{formatAmount(wireAmounts.get(m.userId) ?? 0)}</Figure>
                </MemberLine>
              ))}
            </Section>
          )}
        </>
      )}
    </>
  );
}
