import styled from "styled-components";
import { getBudgetStatus, type BudgetStatus } from "../lib/budget-status.js";

const Container = styled.div`
  width: 100%;
`;

const Track = styled.div`
  width: 100%;
  height: 4px;
  background: ${(p) => p.theme.colors.border};
  border-radius: ${(p) => p.theme.radii.pill};
  overflow: hidden;
`;

const Fill = styled.div<{ $width: number; $status: BudgetStatus }>`
  height: 100%;
  width: ${(p) => Math.min(p.$width, 100)}%;
  background: ${(p) =>
    p.$status === "over"
      ? p.theme.colors.over
      : p.$status === "warn"
        ? p.theme.colors.warn
        : p.theme.colors.ok};
  border-radius: ${(p) => p.theme.radii.pill};
  transition: width 0.3s ease;
`;

const Label = styled.div<{ $status: BudgetStatus }>`
  font-size: 12px;
  color: ${(p) =>
    p.$status === "over"
      ? p.theme.colors.over
      : p.$status === "warn"
        ? p.theme.colors.warn
        : p.theme.colors.textMuted};
  margin-top: 2px;
  text-align: right;
`;

interface ProgressBarProps {
  spent: number;
  budget: number;
  showLabel?: boolean;
  /** Overrides the status derived from spent/budget (e.g. to account for a fixed expense). */
  status?: BudgetStatus;
}

export function ProgressBar({ spent, budget, showLabel, status }: ProgressBarProps) {
  if (budget <= 0) return null;

  const percent = (spent / budget) * 100;
  const resolved = status ?? getBudgetStatus(spent, budget);

  return (
    <Container>
      <Track>
        <Fill $width={percent} $status={resolved} />
      </Track>
      {showLabel && <Label $status={resolved}>{Math.round(percent)}%</Label>}
    </Container>
  );
}
