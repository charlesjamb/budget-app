import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import styled from "styled-components";
import { useHistory } from "../../hooks/useTransactions.js";

const Title = styled.h1`
  font-size: 24px;
  margin-bottom: 24px;
`;

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
  color: #6b7280;
  display: flex;
  align-items: center;
  gap: 6px;
`;

const MonthInput = styled.input`
  padding: 6px 10px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 14px;
`;

const TableWrapper = styled.div`
  overflow-x: auto;
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  min-width: 600px;
`;

const Th = styled.th`
  text-align: left;
  padding: 12px 16px;
  background: #f9fafb;
  border-bottom: 1px solid #e5e7eb;
  font-size: 13px;
  white-space: nowrap;

  &:first-child {
    position: sticky;
    left: 0;
    background: #f9fafb;
    z-index: 1;
  }
`;

const Td = styled.td<{ $highlight?: boolean }>`
  padding: 10px 16px;
  border-bottom: 1px solid #f3f4f6;
  font-size: 14px;
  text-align: right;
  white-space: nowrap;
  color: ${(p) => (p.$highlight ? "#059669" : "inherit")};

  &:first-child {
    text-align: left;
    font-weight: 500;
    position: sticky;
    left: 0;
    background: #fff;
    z-index: 1;
  }
`;

const EmptyState = styled.p`
  text-align: center;
  color: #6b7280;
  padding: 48px;
  font-size: 16px;
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
      <Title>📊 Spending History</Title>

      <Controls>
        <Label>
          From
          <MonthInput
            type="month"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
          />
        </Label>
        <Label>
          To
          <MonthInput
            type="month"
            value={to}
            onChange={(e) => setTo(e.target.value)}
          />
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
