import styled from "styled-components";

const Svg = styled.svg`
  display: block;
  width: 72px;
  height: 20px;

  polyline {
    fill: none;
    stroke: ${(p) => p.theme.colors.textMuted};
    stroke-width: 1.5;
    stroke-linecap: round;
    stroke-linejoin: round;
  }

  circle {
    fill: ${(p) => p.theme.colors.primary};
  }
`;

const W = 72;
const H = 20;
const PAD = 3;

/** Tiny trend line over the values, ending in a dot on the latest one. */
export function Sparkline({ values }: { values: number[] }) {
  if (values.length < 2) return null;
  const max = Math.max(...values);
  const min = Math.min(...values);
  const range = max - min || 1;
  const points = values.map((v, i) => ({
    x: PAD + (i / (values.length - 1)) * (W - PAD * 2),
    y: max === min ? H / 2 : H - PAD - ((v - min) / range) * (H - PAD * 2),
  }));
  const last = points[points.length - 1];
  return (
    <Svg viewBox={`0 0 ${W} ${H}`} aria-hidden>
      <polyline points={points.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ")} />
      <circle cx={last.x} cy={last.y} r={2} />
    </Svg>
  );
}
