import styled from "styled-components";
import { formatAmount } from "./Amount.js";
import { niceCeil } from "../lib/history.js";

const WIDTH = 560;
const HEIGHT = 240;
const MARGIN = { top: 12, right: 12, bottom: 28, left: 44 };
const TICKS = 3;
const NO_SPEND = { spent: 0, budget: 0 };

const Svg = styled.svg`
  display: block;
  width: 100%;
  height: auto;
  font-family: inherit;
`;

const Grid = styled.line`
  stroke: ${(p) => p.theme.colors.border};
  stroke-width: 1;
`;

const AxisLabel = styled.text<{ $anchor?: "start" | "middle" | "end"; $active?: boolean }>`
  fill: ${(p) => (p.$active ? p.theme.colors.text : p.theme.colors.textLight)};
  font-size: 12px;
  font-weight: ${(p) => (p.$active ? 600 : 400)};
  text-anchor: ${(p) => p.$anchor ?? "middle"};
`;

const Column = styled.g`
  cursor: pointer;

  &:focus {
    outline: none;
  }

  &:hover rect.bar,
  &:focus-visible rect.bar {
    opacity: 0.8;
  }

  &:focus-visible rect.hit {
    stroke: ${(p) => p.theme.colors.primary};
    stroke-width: 2;
  }
`;

const Hit = styled.rect`
  fill: transparent;
`;

const Bar = styled.rect<{ $over: boolean }>`
  fill: ${(p) => (p.$over ? p.theme.colors.over : p.theme.colors.primary)};
`;

const BudgetMark = styled.line`
  stroke: ${(p) => p.theme.colors.text};
  stroke-width: 2;
  stroke-dasharray: 4 3;
`;

const Legend = styled.div`
  display: flex;
  gap: ${(p) => p.theme.space.lg};
  justify-content: flex-end;
  font-size: ${(p) => p.theme.fontSize.xs};
  color: ${(p) => p.theme.colors.textMuted};
  margin-bottom: ${(p) => p.theme.space.sm};

  span {
    display: inline-flex;
    align-items: center;
    gap: 6px;
  }

  i {
    display: inline-block;
    width: 14px;
  }

  .spent {
    height: 8px;
    border-radius: 2px;
    background: ${(p) => p.theme.colors.primary};
  }

  .budget {
    border-top: 2px dashed ${(p) => p.theme.colors.text};
  }
`;

function shortMonth(month: string): string {
  const [y, m] = month.split("-").map(Number);
  return new Date(y, m - 1, 1).toLocaleString("en-US", { month: "short" });
}

function compactEuros(cents: number): string {
  const euros = cents / 100;
  return euros >= 1000 ? `${+(euros / 1000).toFixed(1)}k` : String(Math.round(euros));
}

interface SpendChartProps {
  months: string[];
  totals: Record<string, { spent: number; budget: number }>;
  selectedMonth?: string;
  onSelectMonth: (month: string) => void;
}

/** Monthly spend bars with a dashed budget mark; each month is a link to its dashboard. */
export function SpendChart({ months, totals, selectedMonth, onSelectMonth }: SpendChartProps) {
  const max = niceCeil(
    Math.max(...months.map((m) => Math.max(totals[m]?.spent ?? 0, totals[m]?.budget ?? 0))),
  );
  const plotWidth = WIDTH - MARGIN.left - MARGIN.right;
  const plotHeight = HEIGHT - MARGIN.top - MARGIN.bottom;
  const slot = plotWidth / months.length;
  const barWidth = Math.min(48, slot * 0.6);
  const y = (cents: number) => MARGIN.top + plotHeight - (cents / max) * plotHeight;

  return (
    <div>
      <Legend aria-hidden>
        <span>
          <i className="spent" /> spent
        </span>
        <span>
          <i className="budget" /> budget
        </span>
      </Legend>
      <Svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} role="group" aria-label="Monthly spending vs budget">
        {Array.from({ length: TICKS + 1 }, (_, i) => {
          const value = (max / TICKS) * i;
          return (
            <g key={i}>
              <Grid x1={MARGIN.left} x2={WIDTH - MARGIN.right} y1={y(value)} y2={y(value)} />
              <AxisLabel x={MARGIN.left - 8} y={y(value) + 4} $anchor="end">
                {compactEuros(value)}
              </AxisLabel>
            </g>
          );
        })}
        {months.map((month, i) => {
          const { spent, budget } = totals[month] ?? NO_SPEND;
          const cx = MARGIN.left + slot * i + slot / 2;
          const over = budget > 0 && spent > budget;
          const label = `${shortMonth(month)}: ${formatAmount(spent, { decimals: 0 })} spent${
            budget > 0 ? ` of ${formatAmount(budget, { decimals: 0 })} budgeted` : ""
          }`;
          return (
            <Column
              key={month}
              role="link"
              tabIndex={0}
              aria-label={label}
              onClick={() => onSelectMonth(month)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  onSelectMonth(month);
                }
              }}
            >
              <title>{label}</title>
              <Hit
                className="hit"
                x={cx - slot / 2}
                y={MARGIN.top}
                width={slot}
                height={plotHeight + MARGIN.bottom}
              />
              {spent > 0 && (
                <Bar
                  className="bar"
                  $over={over}
                  x={cx - barWidth / 2}
                  y={y(spent)}
                  width={barWidth}
                  height={y(0) - y(spent)}
                  rx={3}
                />
              )}
              {budget > 0 && (
                <BudgetMark
                  x1={cx - barWidth / 2 - 4}
                  x2={cx + barWidth / 2 + 4}
                  y1={y(budget)}
                  y2={y(budget)}
                />
              )}
              <AxisLabel x={cx} y={HEIGHT - 8} $active={month === selectedMonth}>
                {shortMonth(month)}
              </AxisLabel>
            </Column>
          );
        })}
      </Svg>
    </div>
  );
}
