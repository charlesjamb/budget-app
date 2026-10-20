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
import { EmptyState, Header, PageTitle, TitleRow } from "../../components/ui.js";

const SettlementHint = styled.span<{ $positive?: boolean }>`
  font-size: 12px;
  color: ${(p) => (p.$positive ? p.theme.colors.danger : p.theme.colors.success)};
`;

function formatAmount(cents: number): string {
  return (cents / 100).toFixed(2) + " €";
}

function toneOf(cents: number) {
  return cents > 0 ? "positive" : cents < 0 ? "negative" : undefined;
}

export const Route = createFileRoute("/_authenticated/close/settle")({
  component: SettlePage,
});

function SettlePage() {
  const [month, setMonth] = useMonth();
  const {
    isLoading,
    members,
    totalRevenueCents,
    totalSpentCents,
    differenceCents,
    settlementAmounts,
  } = useSplitComputation(month);

  if (isLoading) {
    return <EmptyState>Loading...</EmptyState>;
  }

  return (
    <>
      <TitleRow>
        <Scale size={28} strokeWidth={2} />
        <PageTitle>Settle up</PageTitle>
      </TitleRow>

      <FlowSteps flow="close" current="/close/settle" month={month} />

      <Header>
        <MonthPicker month={month} onChange={setMonth} />
      </Header>

      {members.length === 0 ? (
        <EmptyState>No household members found. Add members in Settings.</EmptyState>
      ) : (
        <Section>
          <SectionTitle>End-of-month settlement</SectionTitle>
          <SummaryRow>
            <SummaryLabel>Total spent</SummaryLabel>
            <SummaryValue>{formatAmount(totalSpentCents)}</SummaryValue>
          </SummaryRow>
          <SummaryRow>
            <SummaryLabel>Difference (spent − budgeted)</SummaryLabel>
            <SummaryValue $accent={differenceCents !== 0} $tone={toneOf(differenceCents)}>
              {differenceCents >= 0 ? "+" : ""}
              {formatAmount(differenceCents)}
            </SummaryValue>
          </SummaryRow>
          {totalRevenueCents > 0 &&
            members.map((m) => {
              const settlement = settlementAmounts.get(m.userId) ?? 0;
              return (
                <MemberLineRow key={m.userId}>
                  <SummaryLabel>{m.email}</SummaryLabel>
                  <div>
                    <SummaryValue $tone={toneOf(settlement)}>
                      {settlement >= 0 ? "+" : ""}
                      {formatAmount(settlement)}
                    </SummaryValue>
                    {settlement !== 0 && (
                      <SettlementHint $positive={settlement > 0}>
                        {settlement > 0 ? " → wire additional" : " → take back"}
                      </SettlementHint>
                    )}
                  </div>
                </MemberLineRow>
              );
            })}
        </Section>
      )}
    </>
  );
}
