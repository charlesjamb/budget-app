import styled from "styled-components";

function getColor(ratio: number): string {
  if (ratio > 1) return "#dc2626";
  if (ratio > 0.75) return "#d97706";
  return "#059669";
}

const Container = styled.div`
  width: 100%;
`;

const Track = styled.div`
  width: 100%;
  height: 8px;
  background: #e5e7eb;
  border-radius: 4px;
  overflow: hidden;
`;

const Fill = styled.div<{ $width: number; $color: string }>`
  height: 100%;
  width: ${(p) => Math.min(p.$width, 100)}%;
  background: ${(p) => p.$color};
  border-radius: 4px;
  transition: width 0.3s ease;
`;

const Label = styled.div<{ $color: string }>`
  font-size: 12px;
  color: ${(p) => p.$color};
  margin-top: 2px;
  text-align: right;
`;

interface ProgressBarProps {
  spent: number;
  budget: number;
  showLabel?: boolean;
}

export function ProgressBar({ spent, budget, showLabel }: ProgressBarProps) {
  if (budget <= 0) return null;

  const ratio = spent / budget;
  const percent = ratio * 100;
  const color = getColor(ratio);

  return (
    <Container>
      <Track>
        <Fill $width={percent} $color={color} />
      </Track>
      {showLabel && <Label $color={color}>{Math.round(percent)}%</Label>}
    </Container>
  );
}
