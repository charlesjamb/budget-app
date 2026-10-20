/**
 * Splits `totalCents` proportionally to `weights`. Each share is rounded, then the rounding
 * remainder goes to the last member with a non-zero weight so the shares sum exactly to the total.
 */
export function computeShares(totalCents: number, weights: number[]): number[] {
  const totalWeight = weights.reduce((sum, w) => sum + w, 0);
  if (totalWeight <= 0) {
    return weights.map(() => 0);
  }

  const shares = weights.map((w) => Math.round((totalCents * w) / totalWeight));
  let lastPayer = weights.length - 1;
  while (weights[lastPayer] <= 0) {
    lastPayer--;
  }
  const remainder = totalCents - shares.reduce((sum, s) => sum + s, 0);
  shares[lastPayer] += remainder;
  return shares;
}
