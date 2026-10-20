import styled from "styled-components";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { addMonths } from "../lib/month.js";

const Container = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  background: ${(p) => p.theme.colors.background};
  padding: 8px 16px;
  border-radius: ${(p) => p.theme.radii.pill};
  border: 1px solid ${(p) => p.theme.colors.border};

  @media (max-width: 640px) {
    width: 100%;
    justify-content: space-between;
  }
`;

const ArrowButton = styled.button`
  background: ${(p) => p.theme.colors.card};
  border: 1px solid ${(p) => p.theme.colors.border};
  border-radius: ${(p) => p.theme.radii.pill};
  width: 36px;
  height: 36px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${(p) => p.theme.colors.textMuted};
  transition: all 0.15s;

  &:hover {
    background: ${(p) => p.theme.colors.primary};
    color: ${(p) => p.theme.colors.onPrimary};
    border-color: ${(p) => p.theme.colors.primary};
  }
`;

const MonthDisplay = styled.span`
  font-size: 18px;
  font-weight: 600;
  min-width: 160px;
  text-align: center;
  color: ${(p) => p.theme.colors.primary};
`;

function formatMonth(month: string): string {
  const [year, m] = month.split("-");
  const date = new Date(parseInt(year), parseInt(m) - 1);
  return date.toLocaleDateString("en-US", { month: "long", year: "numeric" });
}

interface MonthPickerProps {
  month: string;
  onChange: (month: string) => void;
}

export function MonthPicker({ month, onChange }: MonthPickerProps) {
  return (
    <Container>
      <ArrowButton
        type="button"
        aria-label="Previous month"
        onClick={() => onChange(addMonths(month, -1))}
      >
        <ChevronLeft size={20} strokeWidth={2} />
      </ArrowButton>
      <MonthDisplay>{formatMonth(month)}</MonthDisplay>
      <ArrowButton
        type="button"
        aria-label="Next month"
        onClick={() => onChange(addMonths(month, 1))}
      >
        <ChevronRight size={20} strokeWidth={2} />
      </ArrowButton>
    </Container>
  );
}
