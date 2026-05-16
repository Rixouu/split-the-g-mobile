import { formatSplitScore } from '../format-split-score';

describe('formatSplitScore', () => {
  it('formats finite numbers with two decimal places', () => {
    expect(formatSplitScore(12.345)).toBe('12.35');
    expect(formatSplitScore(99)).toBe('99.00');
    expect(formatSplitScore(0.1)).toBe('0.10');
  });

  it('returns placeholder for non-finite or missing values', () => {
    expect(formatSplitScore(null)).toBe('--');
    expect(formatSplitScore(undefined)).toBe('--');
    expect(formatSplitScore(Number.NaN)).toBe('--');
    expect(formatSplitScore(Number.POSITIVE_INFINITY)).toBe('--');
  });

  it('returns placeholder for non-number types', () => {
    expect(formatSplitScore('12' as unknown as number)).toBe('--');
  });
});
