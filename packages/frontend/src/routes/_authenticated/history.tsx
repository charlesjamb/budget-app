import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import styled from "styled-components";
import { useHistory } from "../../hooks/useTransactions.js";

import { BarChart3 } from "lucide-react";
import { PageTitle, TitleRow, EmptyState } from "../../components/ui.js";

const Controls = styled.div`
  display: flex;
  gap: 12px;
  align-items: center;
  margin-bottom: 24px;

  @media (max-width: 640px) {
    flex-wrap: wrap;
    gap: 8px;
  }
`;

const Label = styled.label`
  font-size: 14px;
  color: ${(p) => p.theme.colors.textMuted};
  display: flex;
  align-items: center;
  gap: 6px;
`;

const MonthInput = styled.input`
  padding: 6px 10px;
  border: 1px solid ${(p) => p.theme.colors.borderLight};
  border-radius: ${(p) => p.theme.radii.md};
  font-size: 14px;
  background: ${(p) => p.theme.colors.card};
  color: ${(p) => p.theme.colors.text};
  color-scheme: ${(p) => p.theme.colorScheme};

  &:focus {
    outline: none;
    border-color: ${(p) => p.theme.colors.primary};
    box-shadow: ${(p) => p.theme.shadows.focus};
  }
`;

const TableWrapper = styled.div`
  overflow-x: auto;
  background: ${(p) => p.theme.colors.card};
  border-radius: ${(p) => p.theme.radii.lg};
  box-shadow: ${(p) => p.theme.shadows.card};
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  min-width: 600px;
`;

const Th = styled.th`
  text-align: left;
  padding: 12px 16px;
  background: ${(p) => p.theme.colors.background};
  border-bottom: 1px solid ${(p) => p.theme.colors.border};
  font-size: 13px;
  white-space: nowrap;

  &:first-child {
    position: sticky;
    left: 0;
    background: ${(p) => p.theme.colors.background};
    z-index: 1;
  }
`;

const Td = styled.td<{ $highlight?: boolean }>`
  padding: 10px 16px;
  border-bottom: 1px solid ${(p) => p.theme.colors.border};
  font-size: 14px;
  text-align: right;
  white-space: nowrap;
  color: ${(p) => (p.$highlight ? p.theme.colors.success : "inherit")};

  &:first-child {
    text-align: left;
    font-weight: 500;
    position: sticky;
    left: 0;
    background: ${(p) => p.theme.colors.card};
    z-index: 1;
  }
`;

function formatAmount(cents: number): string {
  return (cents / 100).toFixed(2);
}

function getDefaultRange(): { from: string; to: string } {
  const now = new Date();
  const to = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const fromDate = new Date(now.getFullYear(), now.getMonth() - 5);
  const from = `${fromDate.getFullYear()}-${String(fromDate.getMonth() + 1).padStart(2, "0")}`;
  return { from, to };
}

function formatMonthHeader(month: string): string {
  const [y, m] = month.split("-");
  const date = new Date(parseInt(y), parseInt(m) - 1);
  return date.toLocaleDateString("en-US", { month: "short", year: "2-digit" });
}

export const Route = createFileRoute("/_authenticated/history")({
  component: HistoryPage,
});

function HistoryPage() {
  const defaults = getDefaultRange();
  const [from, setFrom] = useState(defaults.from);
  const [to, setTo] = useState(defaults.to);
  const historyQuery = useHistory(from, to);

  const data = historyQuery.data;

  return (
    <>
      <TitleRow>
        <BarChart3 size={28} strokeWidth={2} />
        <PageTitle>Spending History</PageTitle>
      </TitleRow>

      <Controls>
        <Label>
          From
          <MonthInput type="month" value={from} onChange={(e) => setFrom(e.target.value)} />
        </Label>
        <Label>
          To
          <MonthInput type="month" value={to} onChange={(e) => setTo(e.target.value)} />
        </Label>
      </Controls>

      {!data || data.categories.length === 0 ? (
        <EmptyState>No data for this period.</EmptyState>
      ) : (
        <TableWrapper>
          <Table>
            <thead>
              <tr>
                <Th>Category</Th>
                {data.months.map((m) => (
                  <Th key={m}>{formatMonthHeader(m)}</Th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.categories.map((cat) => (
                <tr key={cat.id}>
                  <Td>{cat.name}</Td>
                  {data.months.map((m) => (
                    <Td key={m} $highlight={!!cat.amounts[m]}>
                      {cat.amounts[m] ? formatAmount(cat.amounts[m]) : "-"}
                    </Td>
                  ))}
                </tr>
              ))}
            </tbody>
          </Table>
        </TableWrapper>
      )}
    </>
  );
}
