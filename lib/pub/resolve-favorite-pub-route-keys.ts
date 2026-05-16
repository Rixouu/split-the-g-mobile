import { supabase } from '@/lib/supabase/client';
import { barKeyToPubPathSegment } from '@/lib/routing/pub-path';

import type { FavoriteRow } from '@/lib/api/profile';

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

  const [segmentIndex, barKeyHits] = await Promise.all([
    fetchDirectorySlugIndex(),
    fetchExistingBarKeys(candidates),
  ]);

  const displayMatchCache = new Map<string, string | null>();

  async function resolveDisplayExact(trimmedTitle: string): Promise<string | null> {
    const cacheKey = trimmedTitle.toLowerCase();
    if (displayMatchCache.has(cacheKey)) return displayMatchCache.get(cacheKey) ?? null;

    let q = await supabase.from('bar_pub_stats_mv').select('bar_key').ilike('display_name', trimmedTitle).limit(1).maybeSingle();
    if (q.error || !q.data) {
      q = await supabase.from('bar_pub_stats').select('bar_key').ilike('display_name', trimmedTitle).limit(1).maybeSingle();
    }
    const bk = q.data?.bar_key ? String(q.data.bar_key).trim() : null;
    displayMatchCache.set(cacheKey, bk);
    return bk;
  }

  const out: Record<string, string> = {};

  for (const f of rows) {
    const trimmed = f.bar_name.trim();
    const lower = trimmed.toLowerCase();
    if (!lower) continue;

    const slugFromTitle = barKeyToPubPathSegment(lower);

    const resolved =
      barKeyHits.get(lower) ??
      barKeyHits.get(slugFromTitle) ??
      segmentIndex.get(slugFromTitle) ??
      (await resolveDisplayExact(trimmed));

    if (resolved) out[f.id] = resolved;
  }

  return out;
}
