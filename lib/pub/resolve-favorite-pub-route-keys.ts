import { supabase } from '@/lib/supabase/client';
import { barKeyToPubPathSegment } from '@/lib/routing/pub-path';

import type { FavoriteRow } from '@/lib/api/profile';
import { escapeIlikePattern } from '@/lib/utils/profile-email';

const BAR_KEY_CHUNK = 120;
const DIRECTORY_SCAN_LIMIT = 1500;

async function fetchDirectorySlugIndex(): Promise<Map<string, string>> {
  let q = await supabase
    .from('bar_pub_stats_mv')
    .select('bar_key, display_name, rating_count')
    .order('rating_count', { ascending: false })
    .limit(DIRECTORY_SCAN_LIMIT);

  if (q.error) {
    q = await supabase
      .from('bar_pub_stats')
      .select('bar_key, display_name, rating_count')
      .order('rating_count', { ascending: false })
      .limit(DIRECTORY_SCAN_LIMIT);
  }

  const segmentToBarKey = new Map<string, string>();
  for (const raw of q.data ?? []) {
    const row = raw as { bar_key?: string; display_name?: string | null };
    const bk = String(row.bar_key ?? '').trim();
    const dn = String(row.display_name ?? '').trim();
    if (!bk || !dn) continue;
    const seg = barKeyToPubPathSegment(dn.toLowerCase());
    if (!segmentToBarKey.has(seg)) segmentToBarKey.set(seg, bk);
  }
  return segmentToBarKey;
}

async function fetchExistingBarKeys(lowerCandidates: string[]): Promise<Map<string, string>> {
  const uniq = [...new Set(lowerCandidates.map((k) => k.trim().toLowerCase()).filter(Boolean))];
  const hit = new Map<string, string>();

  for (let i = 0; i < uniq.length; i += BAR_KEY_CHUNK) {
    const chunk = uniq.slice(i, i + BAR_KEY_CHUNK);
    let q = await supabase.from('bar_pub_stats_mv').select('bar_key').in('bar_key', chunk);
    if (q.error) {
      q = await supabase.from('bar_pub_stats').select('bar_key').in('bar_key', chunk);
    }
    if (q.error) continue;
    for (const raw of q.data ?? []) {
      const bk = String((raw as { bar_key?: string }).bar_key ?? '').trim();
      if (!bk) continue;
      hit.set(bk.toLowerCase(), bk);
    }
  }
  return hit;
}

/**
 * Maps favorite rows → canonical `bar_key` for `/pub/[barKey]`.
 * Favorites saved from pub detail store `bar_key` in `bar_name`; Places-added rows store a title — we match directory slugs and exact keys.
 */
export async function resolveFavoritePubRouteKeys(rows: FavoriteRow[]): Promise<Record<string, string>> {
  if (rows.length === 0) return {};

  const candidates: string[] = [];
  for (const f of rows) {
    const n = f.bar_name.trim().toLowerCase();
    if (!n) continue;
    candidates.push(n);
    candidates.push(barKeyToPubPathSegment(n));
  }

  const barKeyHits = await fetchExistingBarKeys(candidates);
  const out: Record<string, string> = {};
  const unmatched = rows.filter((row) => {
    const lower = row.bar_name.trim().toLowerCase();
    const key = barKeyHits.get(lower) ?? barKeyHits.get(barKeyToPubPathSegment(lower));
    if (key) out[row.id] = key;
    return lower && !key;
  });
  // Directory-backed favorites already contain the canonical key. Skip a 1,500-row scan for them.
  if (unmatched.length === 0) return out;
  const segmentIndex = await fetchDirectorySlugIndex();

  const displayMatchCache = new Map<string, string | null>();

  async function resolveDisplayExact(trimmedTitle: string): Promise<string | null> {
    const cacheKey = trimmedTitle.toLowerCase();
    if (displayMatchCache.has(cacheKey)) return displayMatchCache.get(cacheKey) ?? null;

    const pattern = escapeIlikePattern(trimmedTitle);
    let q = await supabase.from('bar_pub_stats_mv').select('bar_key').ilike('display_name', pattern).limit(1).maybeSingle();
    if (q.error || !q.data) {
      q = await supabase.from('bar_pub_stats').select('bar_key').ilike('display_name', pattern).limit(1).maybeSingle();
    }
    const bk = q.data?.bar_key ? String(q.data.bar_key).trim() : null;
    displayMatchCache.set(cacheKey, bk);
    return bk;
  }

  const missingNames = new Map<string, FavoriteRow[]>();
  for (const row of unmatched) {
    const lower = row.bar_name.trim().toLowerCase();
    const key = segmentIndex.get(barKeyToPubPathSegment(lower));
    if (key) out[row.id] = key;
    else missingNames.set(lower, [...(missingNames.get(lower) ?? []), row]);
  }
  const pending = [...missingNames.values()];
  let next = 0;
  // Resolve private places concurrently with a small bound; one slow venue must not hold up every other link.
  await Promise.all(Array.from({ length: Math.min(4, pending.length) }, async () => {
    while (next < pending.length) {
      const matchingRows = pending[next++];
      const key = await resolveDisplayExact(matchingRows[0].bar_name.trim());
      if (key) for (const row of matchingRows) out[row.id] = key;
    }
  }));

  return out;
}
