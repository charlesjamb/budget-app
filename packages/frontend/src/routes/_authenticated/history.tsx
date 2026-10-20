import { useEffect, useRef, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import styled from "styled-components";
import { BarChart3 } from "lucide-react";
import { useHistory } from "../../hooks/useTransactions.js";
import { useMonth } from "../../hooks/useMonth.js";
import { addMonths } from "../../lib/month.js";
import { averageOverMonths, isOverBudget } from "../../lib/history.js";
import { formatAmount } from "../../components/Amount.js";
import { SpendChart } from "../../components/SpendChart.js";
import { Sparkline } from "../../components/Sparkline.js";
import { PageTitle, TitleRow, EmptyState, SectionHeader } from "../../components/ui.js";

const PRESETS = [3, 6, 12] as const;

const Controls = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: ${(p) => p.theme.space.md};
  margin-bottom: ${(p) => p.theme.space.lg};
`;

const Segmented = styled.div`
  display: inline-flex;
  padding: 3px;
  gap: 2px;
  border-radius: ${(p) => p.theme.radii.pill};
  background: ${(p) => p.theme.colors.sidebar};
`;

const Preset = styled.button<{ $active: boolean }>`
  border: none;
  cursor: pointer;
  padding: 6px 14px;
  border-radius: ${(p) => p.theme.radii.pill};
  font-size: ${(p) => p.theme.fontSize.md};
  font-weight: 500;
  background: ${(p) => (p.$active ? p.theme.colors.card : "transparent")};
  color: ${(p) => (p.$active ? p.theme.colors.text : p.theme.colors.textMuted)};
  box-shadow: ${(p) => (p.$active ? p.theme.shadows.card : "none")};
`;

const RangeLabel = styled.span`
  font-size: ${(p) => p.theme.fontSize.md};
  color: ${(p) => p.theme.colors.textMuted};
`;

const Card = styled.div`
  background: ${(p) => p.theme.colors.card};
  border-radius: ${(p) => p.theme.radii.lg};
  box-shadow: ${(p) => p.theme.shadows.card};
  padding: ${(p) => p.theme.space.lg};
`;

const TableWrapper = styled(Card)`
  padding: 0;
  overflow-x: auto;
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  min-width: 560px;
`;

const Th = styled.th`
  text-align: right;
  padding: 10px 14px;
  font-size: ${(p) => p.theme.fontSize.xs};
  font-weight: 500;
  color: ${(p) => p.theme.colors.textLight};
  border-bottom: 1px solid ${(p) => p.theme.colors.border};
  white-space: nowrap;

  &:first-child {
    text-align: left;
    position: sticky;
    left: 0;
    background: ${(p) => p.theme.colors.card};
    z-index: 1;
  }
`;

const Td = styled.td<{ $over?: boolean; $muted?: boolean }>`
  padding: 10px 14px;
  border-bottom: 1px solid ${(p) => p.theme.colors.border};
  font-size: ${(p) => p.theme.fontSize.md};
  font-variant-numeric: tabular-nums;
  text-align: right;
  white-space: nowrap;
  background: ${(p) => (p.$over ? p.theme.colors.overSoft : "transparent")};
  color: ${(p) =>
    p.$over ? p.theme.colors.over : p.$muted ? p.theme.colors.textLight : "inherit"};

  tr:last-child > & {
    border-bottom: none;
  }

  &:first-child {
    text-align: left;
    font-weight: 500;
    position: sticky;
    left: 0;
    background: ${(p) => p.theme.colors.card};
    z-index: 1;
  }

  svg {
    margin-left: auto;
  }
`;

/** The sparkline column is dropped on phones so the latest month stays next to the average. */
const TrendTh = styled(Th)`
  @media (max-width: 640px) {
    display: none;
  }
`;

const TrendTd = styled(Td)`
  @media (max-width: 640px) {
    display: none;
  }
`;

function formatMonthHeader(month: string): string {
  const [y, m] = month.split("-").map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString("en-US", { month: "short", year: "2-digit" });
}

function formatRange(from: string, to: string): string {
  const fmt = (month: string) => {
    const [y, m] = month.split("-").map(Number);
    return new Date(y, m - 1, 1).toLocaleDateString("en-US", { month: "short", year: "numeric" });
  };
  return `${fmt(from)} – ${fmt(to)}`;
}

export const Route = createFileRoute("/_authenticated/history")({
  component: HistoryPage,
});

function HistoryPage() {
  const [to] = useMonth();
  const navigate = useNavigate();
  const [span, setSpan] = useState<(typeof PRESETS)[number]>(6);
  const from = addMonths(to, -(span - 1));
  const historyQuery = useHistory(from, to);

  const data = historyQuery.data;
  const tableScrollRef = useRef<HTMLDivElement>(null);

  // On narrow screens the table overflows sideways: start at the most recent month.
  useEffect(() => {
    const el = tableScrollRef.current;
    if (el) el.scrollLeft = el.scrollWidth;
  }, [data]);
  const rows = data
    ? data.categories
        .map((cat) => ({ cat, avg: averageOverMonths(cat.amounts, data.months) }))
        .sort((a, b) => b.avg - a.avg)
    : [];

  return (
    <>
      <TitleRow>
        <BarChart3 size={28} strokeWidth={2} />
        <PageTitle>History</PageTitle>
      </TitleRow>

      <Controls>
        <Segmented role="group" aria-label="Range">
          {PRESETS.map((n) => (
            <Preset
              key={n}
              type="button"
              $active={n === span}
              aria-pressed={n === span}
              onClick={() => setSpan(n)}
            >
              {n} months
            </Preset>
          ))}
        </Segmented>
        <RangeLabel>{formatRange(from, to)}</RangeLabel>
      </Controls>

      {!data || data.categories.length === 0 ? (
        <EmptyState>No data for this period.</EmptyState>
      ) : (
        <>
          <Card>
            <SpendChart
              months={data.months}
              totals={data.totals}
              selectedMonth={to}
              onSelectMonth={(month) => void navigate({ to: "/", search: { month } })}
            />
          </Card>

          <SectionHeader>By category</SectionHeader>
          <TableWrapper ref={tableScrollRef}>
            <Table>
              <thead>
                <tr>
                  <Th />
                  {data.months.map((m) => (
                    <Th key={m}>{formatMonthHeader(m)}</Th>
                  ))}
                  <Th>Avg</Th>
                  <TrendTh>Trend</TrendTh>
                </tr>
              </thead>
              <tbody>
                {rows.map(({ cat, avg }) => (
                  <tr key={cat.id}>
                    <Td>
                      {cat.icon ? `${cat.icon} ` : ""}
                      {cat.name}
                    </Td>
                    {data.months.map((m) => {
                      const spent = cat.amounts[m] ?? 0;
                      const over = isOverBudget(spent, data.budgets[m]?.[cat.id]);
                      return (
                        <Td key={m} $over={over} $muted={spent === 0}>
                          {spent ? formatAmount(spent, { decimals: 0 }) : "–"}
                        </Td>
                      );
                    })}
                    <Td>{formatAmount(avg, { decimals: 0 })}</Td>
                    <TrendTd>
                      <Sparkline values={data.months.map((m) => cat.amounts[m] ?? 0)} />
                    </TrendTd>
                  </tr>
                ))}
              </tbody>
            </Table>
          </TableWrapper>
        </>
      )}
    </>
  );
}
