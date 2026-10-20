import styled from "styled-components";

const MINUS = "\u2212";
const NBSP = "\u00A0";

interface FormatAmountOptions {
  /** Prefix positive amounts with "+" (negative amounts always get "−"). */
  signed?: boolean;
  /** Fraction digits to show; defaults to 2. */
  decimals?: 0 | 2;
}

/** Formats cents as e.g. `1 607.00 €`, with a thousands separator, a typographic minus and the € sign. */
export function formatAmount(
  cents: number,
  { signed = false, decimals = 2 }: FormatAmountOptions = {},
) {
  const abs = Math.abs(cents) / 100;
  const [int, frac] = abs.toFixed(decimals).split(".");
  const grouped = int.replace(/\B(?=(\d{3})+(?!\d))/g, NBSP);
  const body = frac ? `${grouped}.${frac}` : grouped;
  const rounded = Number(abs.toFixed(decimals));
  const sign = cents < 0 && rounded !== 0 ? MINUS : signed && rounded !== 0 ? "+" : "";
  return `${sign}${body}${NBSP}€`;
}

type AmountTone = "default" | "positive" | "negative" | "muted";

const Value = styled.span<{ $tone: AmountTone }>`
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
  color: ${(p) =>
    p.$tone === "positive"
      ? p.theme.colors.ok
      : p.$tone === "negative"
        ? p.theme.colors.over
        : p.$tone === "muted"
          ? p.theme.colors.textMuted
          : "inherit"};
`;

interface AmountProps extends FormatAmountOptions {
  cents: number;
  tone?: AmountTone;
}

export function Amount({ cents, tone = "default", ...options }: AmountProps) {
  return <Value $tone={tone}>{formatAmount(cents, options)}</Value>;
}
