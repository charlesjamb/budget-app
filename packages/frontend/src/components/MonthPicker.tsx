import styled from "styled-components";

const Container = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
`;

const ArrowButton = styled.button`
  background: #f0f0f0;
  border: none;
  border-radius: 6px;
  width: 36px;
  height: 36px;
  cursor: pointer;
  font-size: 18px;
  display: flex;
  align-items: center;
  justify-content: center;

  &:hover {
    background: #e0e0e0;
  }
`;

const MonthDisplay = styled.span`
  font-size: 18px;
  font-weight: 600;
  min-width: 160px;
  text-align: center;
`;

function formatMonth(month: string): string {
  const [year, m] = month.split("-");
  const date = new Date(parseInt(year), parseInt(m) - 1);
  return date.toLocaleDateString("en-US", { month: "long", year: "numeric" });
}

function addMonths(month: string, offset: number): string {
  const [year, m] = month.split("-").map(Number);
  const date = new Date(year, m - 1 + offset);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

interface MonthPickerProps {
  month: string;
  onChange: (month: string) => void;
}

export function MonthPicker({ month, onChange }: MonthPickerProps) {
  return (
    <Container>
      <ArrowButton onClick={() => onChange(addMonths(month, -1))}>
        &larr;
      </ArrowButton>
      <MonthDisplay>{formatMonth(month)}</MonthDisplay>
      <ArrowButton onClick={() => onChange(addMonths(month, 1))}>
        &rarr;
      </ArrowButton>
    </Container>
  );
}
