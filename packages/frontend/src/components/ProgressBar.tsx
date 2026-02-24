import styled, { useTheme } from "styled-components";

function getFillColor(
  ratio: number,
  theme: {
    colors: {
      danger: string;
      warning: string;
      success: string;
      textMuted: string;
    };
  },
): string {
  if (ratio > 1) return theme.colors.danger;
  if (ratio > 0.75) return theme.colors.warning;
  return theme.colors.success;
}

function getLabelColor(
  ratio: number,
  theme: {
    colors: {
      danger: string;
      warning: string;
      success: string;
      textMuted: string;
    };
  },
): string {
  if (ratio > 1) return theme.colors.danger;
  if (ratio > 0.75) return theme.colors.warning;
  if (ratio > 0) return theme.colors.success;
  return theme.colors.textMuted;
}

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

const Fill = styled.div<{ $width: number; $color: string }>`
  height: 100%;
  width: ${(p) => Math.min(p.$width, 100)}%;
  background: ${(p) => p.$color};
  border-radius: ${(p) => p.theme.radii.pill};
  transition: width 0.3s ease;
  opacity: 0.7;
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
  const theme = useTheme();
  if (budget <= 0) return null;

  const ratio = spent / budget;
  const percent = ratio * 100;
  const fillColor = getFillColor(ratio, theme);
  const labelColor = getLabelColor(ratio, theme);

  return (
    <Container>
      <Track>
        <Fill $width={percent} $color={fillColor} />
      </Track>
      {showLabel && <Label $color={labelColor}>{Math.round(percent)}%</Label>}
    </Container>
  );
}
