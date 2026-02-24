import styled from "styled-components";

function getGradient(ratio: number): string {
  if (ratio > 1) return "linear-gradient(90deg, #ef4444 0%, #f87171 100%)";
  if (ratio > 0.75) return "linear-gradient(90deg, #f59e0b 0%, #fbbf24 100%)";
  return "linear-gradient(90deg, #10b981 0%, #14b8a6 100%)";
}

function getLabelColor(ratio: number): string {
  if (ratio > 1) return "#ef4444";
  if (ratio > 0.75) return "#f59e0b";
  return "#10b981";
}

const Container = styled.div`
  width: 100%;
`;

const Track = styled.div`
  width: 100%;
  height: 10px;
  background: ${(p) => p.theme.colors.background};
  border-radius: ${(p) => p.theme.radii.pill};
  overflow: hidden;
`;

const Fill = styled.div<{ $width: number; $gradient: string }>`
  height: 100%;
  width: ${(p) => Math.min(p.$width, 100)}%;
  background: ${(p) => p.$gradient};
  border-radius: ${(p) => p.theme.radii.pill};
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
  const gradient = getGradient(ratio);
  const labelColor = getLabelColor(ratio);

  return (
    <Container>
      <Track>
        <Fill $width={percent} $gradient={gradient} />
      </Track>
      {showLabel && <Label $color={labelColor}>{Math.round(percent)}%</Label>}
    </Container>
  );
}
