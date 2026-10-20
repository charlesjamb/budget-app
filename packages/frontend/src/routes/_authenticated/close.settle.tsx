import { createFileRoute } from "@tanstack/react-router";
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
  BigNumber,
  Note,
} from "../../components/split-ui.js";
import { useMonth } from "../../hooks/useMonth.js";
import { useSplitComputation } from "../../hooks/useSplitComputation.js";
import { memberName, settlementVerb } from "../../lib/members.js";
import { EmptyState, Header, PageTitle, TitleRow } from "../../components/ui.js";

function monthName(month: string): string {
  const [y, m] = month.split("-").map(Number);
  return new Date(y, m - 1, 1).toLocaleString("en-US", { month: "long" });
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
    totalBudgetedCents,
    totalSpentCents,
    differenceCents,
    settlementAmounts,
  } = useSplitComputation(month);

  if (isLoading) {
    return <EmptyState>Loading...</EmptyState>;
  }

  const leftOver = -differenceCents;

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
          <SectionTitle>
            {monthName(month)}: spent {formatAmount(totalSpentCents, { decimals: 0 })} of{" "}
            {formatAmount(totalBudgetedCents, { decimals: 0 })}
          </SectionTitle>
          <BigNumber>{formatAmount(Math.abs(leftOver))}</BigNumber>
          <Note>
            {leftOver > 0
              ? "left in the joint account"
              : leftOver < 0
                ? "over budget, to top up the joint account"
                : "spent exactly on budget"}
          </Note>
          {totalRevenueCents === 0 ? (
            <Note>Enter the incomes on the Wires page to split this between you.</Note>
          ) : (
            differenceCents !== 0 &&
            members.map((m) => {
              const settlement = settlementAmounts.get(m.userId) ?? 0;
              const verb = settlementVerb(settlement);
              return (
                <MemberLine key={m.userId}>
                  <MemberLabel>→ {memberName(m)}</MemberLabel>
                  <Figure $tone={verb === "owes" ? "over" : verb === "gets back" ? "ok" : "muted"}>
                    {verb ? `${verb} ${formatAmount(Math.abs(settlement))}` : "nothing to settle"}
                  </Figure>
                </MemberLine>
              );
            })
          )}
        </Section>
      )}
    </>
  );
}
