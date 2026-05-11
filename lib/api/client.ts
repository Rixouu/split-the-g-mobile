import { appConfig } from '@/lib/config';
import { supabase } from '@/lib/supabase/client';

import type { CompetitionDetail, CompetitionSummary, PourScore, PubSummary } from './types';

const SCORE_PUBLIC_SELECT =
  'id, slug, split_score, split_image_url, pint_image_url, g_closeup_image_url, username, city, region, country, country_code, created_at, bar_name, bar_address, google_place_id, pour_rating, pint_price';

export async function fetchRecentScores(limit = 20): Promise<PourScore[]> {
  const { data, error } = await supabase
    .from('scores')
    .select(SCORE_PUBLIC_SELECT)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return (data ?? []) as PourScore[];
}

export async function fetchScoreByRef(pourRef: string): Promise<PourScore | null> {
  const ref = pourRef.trim();
  const isUuid =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(ref);

  if (isUuid) {
    const { data, error } = await supabase
      .from('scores')
      .select(SCORE_PUBLIC_SELECT)
      .eq('id', ref)
      .maybeSingle();
    if (error) throw error;
    return data as PourScore | null;
  }

  const { data, error } = await supabase
    .from('scores')
    .select(SCORE_PUBLIC_SELECT)
    .eq('slug', ref)
    .maybeSingle();
  if (error) throw error;
  return data as PourScore | null;
}

export async function fetchLeaderboard(limit = 25): Promise<PourScore[]> {
  const { data, error } = await supabase
    .from('scores')
    .select(SCORE_PUBLIC_SELECT)
    .not('split_score', 'is', null)
    .order('split_score', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return (data ?? []) as PourScore[];
}

const COMPETITION_SELECT =
  'id, title, starts_at, ends_at, visibility, win_rule, path_segment, created_at';

export async function fetchPublicCompetitions(limit = 30): Promise<CompetitionSummary[]> {
  const { data, error } = await supabase
    .from('competitions')
    .select(COMPETITION_SELECT)
    .eq('visibility', 'public')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return (data ?? []) as CompetitionSummary[];
}

const COMPETITION_DETAIL_SELECT =
  'id, title, created_by, max_participants, glasses_per_person, starts_at, ends_at, win_rule, target_score, created_at, visibility, location_name, location_address, linked_bar_key, path_segment';

const COMPETITION_UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function fetchCompetitionByRef(ref: string): Promise<CompetitionDetail | null> {
  const trimmed = ref.trim();
  if (!trimmed) return null;

  if (COMPETITION_UUID_RE.test(trimmed)) {
    const { data, error } = await supabase
      .from('competitions')
      .select(COMPETITION_DETAIL_SELECT)
      .eq('id', trimmed)
      .maybeSingle();
    if (error) throw error;
    return data as CompetitionDetail | null;
  }

  const { data, error } = await supabase
    .from('competitions')
    .select(COMPETITION_DETAIL_SELECT)
    .ilike('path_segment', trimmed)
    .maybeSingle();
  if (error) throw error;
  return data as CompetitionDetail | null;
}

export async function fetchPubByBarKey(barKey: string): Promise<PubSummary | null> {
  const key = barKey.trim();
  if (!key) return null;

  const { data, error } = await supabase
    .from('bar_pub_stats')
    .select(
      'bar_key, display_name, sample_address, google_place_id, avg_pour_rating, rating_count, submission_count',
    )
    .eq('bar_key', key)
    .maybeSingle();

  if (error) throw error;
  return data as PubSummary | null;
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
