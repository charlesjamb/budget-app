import { useState, useCallback, useMemo } from "react";
import { createFileRoute } from "@tanstack/react-router";
import styled from "styled-components";
import { MonthPicker } from "../../components/MonthPicker.js";
import { Scale } from "lucide-react";
import {
  Button,
  AmountInput,
  EmptyState,
  PageTitle,
  TitleRow,
} from "../../components/ui.js";
import { useContributions, useUpsertContributions } from "../../hooks/useContributions.js";
import { useBudgets } from "../../hooks/useBudgets.js";
import { useMonthlySummary } from "../../hooks/useTransactions.js";
import type { ContributionMember } from "@budget-app/shared";

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

const SaveStatus = styled.span<{ $success?: boolean }>`
  font-size: 13px;
  color: ${(p) =>
    p.$success ? p.theme.colors.success : p.theme.colors.textMuted};
`;

const Section = styled.div`
  background: ${(p) => p.theme.colors.card};
  border-radius: ${(p) => p.theme.radii.lg};
  box-shadow: ${(p) => p.theme.shadows.card};
  padding: 20px;
  margin-bottom: 24px;
`;

const SectionTitle = styled.h2`
  font-size: 16px;
  font-weight: 600;
  margin: 0 0 16px 0;
  color: ${(p) => p.theme.colors.text};
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
  min-width: 80px;
`;

const SummaryRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;

  &:last-child {
    margin-bottom: 0;
  }
`;

const SummaryLabel = styled.span`
  font-size: 14px;
  color: ${(p) => p.theme.colors.textMuted};
`;

const SummaryValue = styled.span<{ $accent?: boolean }>`
  font-size: 16px;
  font-weight: 600;
  color: ${(p) =>
    p.$accent ? p.theme.colors.primary : p.theme.colors.text};
`;

const WireAmountRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
  border-top: 1px solid ${(p) => p.theme.colors.border};
  margin-top: 8px;
`;

const SettlementRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
  border-top: 1px solid ${(p) => p.theme.colors.border};
  margin-top: 8px;
`;

const SettlementHint = styled.span<{ $positive?: boolean }>`
  font-size: 12px;
  color: ${(p) =>
    p.$positive ? p.theme.colors.danger : p.theme.colors.success};
`;

function formatAmount(cents: number): string {
  return (cents / 100).toFixed(2) + " €";
}

function getCurrentMonth(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

export const Route = createFileRoute("/_authenticated/split")({
  component: SplitPage,
});

function SplitPage() {
  const [month, setMonth] = useState(getCurrentMonth);
  const [localRevenues, setLocalRevenues] = useState<Record<number, string>>({});
  const [dirty, setDirty] = useState(false);
  const [saved, setSaved] = useState(false);

  const contributionsQuery = useContributions(month);
  const budgetsQuery = useBudgets(month);
  const summaryQuery = useMonthlySummary(month);
  const upsertMutation = useUpsertContributions();

  const members = useMemo(
    () => contributionsQuery.data?.members ?? [],
    [contributionsQuery.data?.members],
  );

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

  // Compute effective members with local overrides
  const effectiveMembers: ContributionMember[] = useMemo(() => {
    return members.map((m) => {
      const localVal = localRevenues[m.userId];
      const revenueCents =
        localVal !== undefined
          ? Math.round(parseFloat(localVal) * 100) || 0
          : m.revenueCents;
      return { ...m, revenueCents };
    });
  }, [members, localRevenues]);

  const totalRevenueCents = useMemo(
    () => effectiveMembers.reduce((sum, m) => sum + m.revenueCents, 0),
    [effectiveMembers],
  );

  const ratios = useMemo(() => {
    const map = new Map<number, number>();
    if (totalRevenueCents > 0) {
      for (const m of effectiveMembers) {
        map.set(m.userId, m.revenueCents / totalRevenueCents);
      }
    }
    return map;
  }, [effectiveMembers, totalRevenueCents]);

  const totalBudgetedCents = useMemo(() => {
    return (budgetsQuery.data?.budgets ?? []).reduce(
      (sum, b) => sum + b.amountCents,
      0,
    );
  }, [budgetsQuery.data?.budgets]);

  const totalSpentCents = summaryQuery.data?.totalAmount ?? 0;
  const differenceCents = totalSpentCents - totalBudgetedCents;

  const wireAmounts = useMemo(() => {
    const map = new Map<number, number>();
    for (const m of effectiveMembers) {
      const ratio = ratios.get(m.userId) ?? 0;
      map.set(m.userId, Math.round(totalBudgetedCents * ratio));
    }
    return map;
  }, [effectiveMembers, ratios, totalBudgetedCents]);

  const settlementAmounts = useMemo(() => {
    const map = new Map<number, number>();
    for (const m of effectiveMembers) {
      const ratio = ratios.get(m.userId) ?? 0;
      map.set(m.userId, Math.round(differenceCents * ratio));
    }
    return map;
  }, [effectiveMembers, ratios, differenceCents]);

  if (contributionsQuery.isLoading || budgetsQuery.isLoading) {
    return <EmptyState>Loading...</EmptyState>;
  }

  return (
    <>
      <TitleRow>
        <Scale size={28} strokeWidth={2} />
        <PageTitle>Monthly Split</PageTitle>
      </TitleRow>

      <Header>
        <MonthPicker month={month} onChange={handleMonthChange} />
        <HeaderActions>
          <Button
            onClick={handleSave}
            disabled={!dirty || upsertMutation.isPending}
          >
            {upsertMutation.isPending ? "Saving..." : "Save"}
          </Button>
          {saved && <SaveStatus $success>Saved!</SaveStatus>}
        </HeaderActions>
      </Header>

      {members.length === 0 ? (
        <EmptyState>
          No household members found. Add members in Settings.
        </EmptyState>
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
            <SummaryRow style={{ marginTop: 16 }}>
              <SummaryLabel>Total revenue</SummaryLabel>
              <SummaryValue $accent>
                {formatAmount(totalRevenueCents)}
              </SummaryValue>
            </SummaryRow>
            {totalRevenueCents > 0 && (
              <>
                {members.map((m) => (
                  <SummaryRow key={m.userId}>
                    <SummaryLabel>{m.email} ratio</SummaryLabel>
                    <SummaryValue>
                      {((ratios.get(m.userId) ?? 0) * 100).toFixed(1)}%
                    </SummaryValue>
                  </SummaryRow>
                ))}
              </>
            )}
          </Section>

          <Section>
            <SectionTitle>Wire amounts (beginning of month)</SectionTitle>
            <SummaryRow>
              <SummaryLabel>Total budgeted</SummaryLabel>
              <SummaryValue>{formatAmount(totalBudgetedCents)}</SummaryValue>
            </SummaryRow>
            {totalRevenueCents > 0 &&
              members.map((m) => (
                <WireAmountRow key={m.userId}>
                  <SummaryLabel>{m.email}</SummaryLabel>
                  <SummaryValue>
                    {formatAmount(wireAmounts.get(m.userId) ?? 0)}
                  </SummaryValue>
                </WireAmountRow>
              ))}
          </Section>

          <Section>
            <SectionTitle>End-of-month settlement</SectionTitle>
            <SummaryRow>
              <SummaryLabel>Total spent</SummaryLabel>
              <SummaryValue>{formatAmount(totalSpentCents)}</SummaryValue>
            </SummaryRow>
            <SummaryRow>
              <SummaryLabel>Difference (spent − budgeted)</SummaryLabel>
              <SummaryValue
                $accent={differenceCents !== 0}
                style={{
                  color:
                    differenceCents > 0
                      ? "var(--color-danger, #dc3545)"
                      : differenceCents < 0
                        ? "var(--color-success, #28a745)"
                        : undefined,
                }}
              >
                {differenceCents >= 0 ? "+" : ""}
                {formatAmount(differenceCents)}
              </SummaryValue>
            </SummaryRow>
            {totalRevenueCents > 0 &&
              members.map((m) => {
                const settlement = settlementAmounts.get(m.userId) ?? 0;
                return (
                  <SettlementRow key={m.userId}>
                    <SummaryLabel>{m.email}</SummaryLabel>
                    <div>
                      <SummaryValue
                        style={{
                          color:
                            settlement > 0
                              ? "var(--color-danger, #dc3545)"
                              : settlement < 0
                                ? "var(--color-success, #28a745)"
                                : undefined,
                        }}
                      >
                        {settlement >= 0 ? "+" : ""}
                        {formatAmount(settlement)}
                      </SummaryValue>
                      {settlement !== 0 && (
                        <SettlementHint $positive={settlement > 0}>
                          {settlement > 0
                            ? " → wire additional"
                            : " → take back"}
                        </SettlementHint>
                      )}
                    </div>
                  </SettlementRow>
                );
              })}
          </Section>
        </>
      )}
    </>
  );
}
