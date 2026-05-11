import { appConfig } from '@/lib/config';
import { supabase } from '@/lib/supabase/client';

import type { PourScore, PubSummary } from './types';

export async function fetchRecentScores(limit = 20): Promise<PourScore[]> {
  const { data, error } = await supabase
    .from('scores')
    .select(
      'id, slug, split_score, split_image_url, pint_image_url, g_closeup_image_url, username, city, region, country, country_code, created_at',
    )
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return (data ?? []) as PourScore[];
}

export async function fetchScoreByRef(pourRef: string): Promise<PourScore | null> {
  const ref = pourRef.trim();
  const isUuid =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(ref);

  const query = supabase
    .from('scores')
    .select(
      'id, slug, split_score, split_image_url, pint_image_url, g_closeup_image_url, username, city, region, country, country_code, created_at',
    )
    .limit(1);

  const { data, error } = isUuid
    ? await query.eq('id', ref).maybeSingle()
    : await query.eq('slug', ref).maybeSingle();
  if (error) throw error;
  return data as PourScore | null;
}

export async function fetchLeaderboard(limit = 25): Promise<PourScore[]> {
  const { data, error } = await supabase
    .from('scores')
    .select(
      'id, slug, split_score, split_image_url, pint_image_url, g_closeup_image_url, username, city, region, country, country_code, created_at',
    )
    .not('split_score', 'is', null)
    .order('split_score', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return (data ?? []) as PourScore[];
}

export async function fetchPubs(limit = 50): Promise<PubSummary[]> {
  const { data, error } = await supabase
    .from('bar_pub_stats')
    .select(
      'bar_key, display_name, sample_address, google_place_id, avg_pour_rating, rating_count, submission_count',
    )
    .order('rating_count', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return (data ?? []) as PubSummary[];
}

export function absoluteWebUrl(path: string): string {
  if (/^https?:\/\//i.test(path)) return path;
  return `${appConfig.siteUrl}${path.startsWith('/') ? path : `/${path}`}`;
}
