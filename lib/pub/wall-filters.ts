import type { PubWallScoreRow } from '@/lib/api/types';

export type PubWallSort = 'newest' | 'oldest' | 'score_high' | 'score_low';

export const PUB_WALL_PAGE_SIZE = 12;

export function startOfLocalDay(ymd: string): number {
  const [y, m, d] = ymd.split('-').map(Number);
  if (!y || !m || !d) return NaN;
  return new Date(y, m - 1, d, 0, 0, 0, 0).getTime();
}

export function endOfLocalDay(ymd: string): number {
  const [y, m, d] = ymd.split('-').map(Number);
  if (!y || !m || !d) return NaN;
  return new Date(y, m - 1, d, 23, 59, 59, 999).getTime();
}

export function filterSortPubWallRows(
  items: PubWallScoreRow[],
  params: {
    sort: PubWallSort;
    minScore: string;
    dateFrom: string;
    dateTo: string;
    countryFilter: string;
  },
): PubWallScoreRow[] {
  const min = Number.parseFloat(params.minScore);
  const minOk = Number.isFinite(min) ? min : 0;
  const fromTs = params.dateFrom.trim() ? startOfLocalDay(params.dateFrom.trim()) : null;
  const toTs = params.dateTo.trim() ? endOfLocalDay(params.dateTo.trim()) : null;
  const countryWant = params.countryFilter.trim().toUpperCase();

  const list = items.filter((s) => {
    if (s.split_score < minOk) return false;
    const t = new Date(s.created_at).getTime();
    if (fromTs != null && Number.isFinite(fromTs) && t < fromTs) return false;
    if (toTs != null && Number.isFinite(toTs) && t > toTs) return false;
    if (countryWant) {
      const got = s.country_code?.trim().toUpperCase() ?? '';
      if (got !== countryWant) return false;
    }
    return true;
  });

  const sorted = [...list];
  switch (params.sort) {
    case 'oldest':
      sorted.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
      break;
    case 'score_high':
      sorted.sort((a, b) => b.split_score - a.split_score);
      break;
    case 'score_low':
      sorted.sort((a, b) => a.split_score - b.split_score);
      break;
    case 'newest':
    default:
      sorted.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }
  return sorted;
}

export function wallCountryCodesFromRows(items: PubWallScoreRow[]): { code: string; name: string }[] {
  const codes = new Set<string>();
  for (const s of items) {
    const c = s.country_code?.trim().toUpperCase();
    if (c && /^[A-Z]{2}$/.test(c)) codes.add(c);
  }
  let displayNames: Intl.DisplayNames;
  try {
    displayNames = new Intl.DisplayNames(undefined, { type: 'region' });
  } catch {
    displayNames = new Intl.DisplayNames('en', { type: 'region' });
  }
  return [...codes]
    .sort()
    .map((code) => ({
      code,
      name: displayNames.of(code) ?? code,
    }));
}
