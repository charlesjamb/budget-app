import { useState, useCallback } from "react";
import { createFileRoute } from "@tanstack/react-router";
import styled from "styled-components";
import { MonthPicker } from "../../components/MonthPicker.js";
import { FlowSteps } from "../../components/FlowSteps.js";
import {
  Section,
  SectionTitle,
  SummaryRow,
  SummaryLabel,
  SummaryValue,
  MemberLineRow,
} from "../../components/split-ui.js";
import { useMonth } from "../../hooks/useMonth.js";
import { useSplitComputation } from "../../hooks/useSplitComputation.js";
import { Scale } from "lucide-react";
import {
  Button,
  AmountInput,
  EmptyState,
  Header,
  PageTitle,
  SaveStatus,
  TitleRow,
} from "../../components/ui.js";
import { useUpsertContributions } from "../../hooks/useContributions.js";

const HeaderActions = styled.div`
  display: flex;
  gap: 8px;
  align-items: center;
`;

const MemberRow = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 12px;

  &:last-child {
    margin-bottom: 0;
  }

  @media (max-width: 640px) {
    flex-wrap: wrap;
  }
`;

const MemberEmail = styled.span`
  font-size: 14px;
  color: ${(p) => p.theme.colors.text};
  min-width: 160px;
`;

const AmountLabel = styled.span`
  font-size: 13px;
  color: ${(p) => p.theme.colors.textMuted};
  min-width: 0;
`;

function formatAmount(cents: number): string {
  return (cents / 100).toFixed(2) + " €";
}

export const Route = createFileRoute("/_authenticated/plan/wires")({
  component: WiresPage,
});

function WiresPage() {
  const [month, setMonth] = useMonth();
  const [localRevenues, setLocalRevenues] = useState<Record<number, string>>({});
  const [dirty, setDirty] = useState(false);
  const [saved, setSaved] = useState(false);

  const upsertMutation = useUpsertContributions();
  const { isLoading, members, totalRevenueCents, ratios, totalBudgetedCents, wireAmounts } =
    useSplitComputation(month, localRevenues);

  const getInputValue = useCallback(
    (userId: number): string => {
      if (localRevenues[userId] !== undefined) {
        return localRevenues[userId];
      }
      const member = members.find((m) => m.userId === userId);
      return member ? (member.revenueCents / 100).toFixed(2) : "";
    },
    [localRevenues, members],
  );

  const handleInputChange = (userId: number, value: string) => {
    setLocalRevenues((prev) => ({ ...prev, [userId]: value }));
    setDirty(true);
    setSaved(false);
  };

  const handleMonthChange = (newMonth: string) => {
    setMonth(newMonth);
    setLocalRevenues({});
    setDirty(false);
    setSaved(false);
  };

  const handleSave = () => {
    const contributions = members.map((m) => {
      const value = localRevenues[m.userId];
      const parsed = value !== undefined ? parseFloat(value) : NaN;
      const revenueCents = isNaN(parsed) ? 0 : Math.round(parsed * 100);
      return { userId: m.userId, revenueCents };
    });

    upsertMutation.mutate(
      { month, contributions },
      {
        onSuccess: () => {
          setLocalRevenues({});
          setDirty(false);
          setSaved(true);
        },
      },
    );
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
        <MonthPicker month={month} onChange={handleMonthChange} />
        <HeaderActions>
          <Button onClick={handleSave} disabled={!dirty || upsertMutation.isPending}>
            {upsertMutation.isPending ? "Saving..." : "Save"}
          </Button>
          {saved && <SaveStatus $success>Saved!</SaveStatus>}
        </HeaderActions>
      </Header>

      {members.length === 0 ? (
        <EmptyState>No household members found. Add members in Settings.</EmptyState>
      ) : (
        <>
          <Section>
            <SectionTitle>Revenue (monthly income)</SectionTitle>
            {members.map((m) => (
              <MemberRow key={m.userId}>
                <MemberEmail>{m.email}</MemberEmail>
                <AmountInput
                  type="text"
                  inputMode="decimal"
                  placeholder="0.00"
                  value={getInputValue(m.userId)}
                  onChange={(e) => handleInputChange(m.userId, e.target.value)}
                />
                <AmountLabel>€</AmountLabel>
              </MemberRow>
            ))}
            <SummaryRow $spaced>
              <SummaryLabel>Total revenue</SummaryLabel>
              <SummaryValue $accent>{formatAmount(totalRevenueCents)}</SummaryValue>
            </SummaryRow>
            {totalRevenueCents > 0 &&
              members.map((m) => (
                <SummaryRow key={m.userId}>
                  <SummaryLabel>{m.email} ratio</SummaryLabel>
                  <SummaryValue>{((ratios.get(m.userId) ?? 0) * 100).toFixed(1)}%</SummaryValue>
                </SummaryRow>
              ))}
          </Section>

          <Section>
            <SectionTitle>Wire amounts (beginning of month)</SectionTitle>
            <SummaryRow>
              <SummaryLabel>Total budgeted</SummaryLabel>
              <SummaryValue>{formatAmount(totalBudgetedCents)}</SummaryValue>
            </SummaryRow>
            {totalRevenueCents > 0 &&
              members.map((m) => (
                <MemberLineRow key={m.userId}>
                  <SummaryLabel>{m.email}</SummaryLabel>
                  <SummaryValue>{formatAmount(wireAmounts.get(m.userId) ?? 0)}</SummaryValue>
                </MemberLineRow>
              ))}
          </Section>
        </>
      )}
    </>
  );
}
