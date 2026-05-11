/** Match web score headline: two decimal places, not rounded percent. */
export function formatSplitScore(value: number | null | undefined): string {
  if (typeof value !== 'number' || !Number.isFinite(value)) return '--';
  return value.toFixed(2);
}
