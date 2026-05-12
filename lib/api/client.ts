import { appConfig } from '@/lib/config';
import { generateBeerUsername } from '@/lib/utils/username-generator';
import { supabase } from '@/lib/supabase/client';

import type {
  CompetitionDetail,
  CompetitionSummary,
  PourRankContext,
  PourScore,
  PubDetailPageData,
  PubExtraStatsRow,
  PubLinkedCompetitionRow,
  PubPlaceDetailsRow,
  PubSummary,
  PubWallScoreRow,
} from './types';

const SCORE_PUBLIC_SELECT =
  'id, slug, split_score, split_image_url, pint_image_url, g_closeup_image_url, username, city, region, country, country_code, created_at, bar_name, bar_address, google_place_id, pour_rating, pint_price, session_id, submitter_user_id, email, email_opted_out';

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

/** Match web `score.tsx` loader rank + totals (7-day rolling window from now). */
export async function fetchPourRankContext(
  splitScore: number,
  createdAtIso: string,
): Promise<PourRankContext> {
  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
  const weekStart = oneWeekAgo.toISOString();

  const [
    { count: higherScoresCount, error: higherScoresError },
    { count: weeklyHigherScoresCount, error: weeklyHigherScoresError },
    { count: totalSplits, error: totalError },
    { count: weeklyTotalSplits, error: weeklyTotalError },
  ] = await Promise.all([
    supabase
      .from('scores')
      .select('*', { count: 'exact', head: true })
      .gt('split_score', splitScore),
    supabase
      .from('scores')
      .select('*', { count: 'exact', head: true })
      .gt('split_score', splitScore)
      .gte('created_at', weekStart),
    supabase.from('scores').select('*', { count: 'exact', head: true }),
    supabase.from('scores').select('*', { count: 'exact', head: true }).gte('created_at', weekStart),
  ]);

  if (higherScoresError) throw higherScoresError;
  if (weeklyHigherScoresError) throw weeklyHigherScoresError;
  if (totalError) throw totalError;
  if (weeklyTotalError) throw weeklyTotalError;

  const allTimeRank = (higherScoresCount ?? 0) + 1;
  const weeklyRank = (weeklyHigherScoresCount ?? 0) + 1;

  return {
    allTimeRank,
    weeklyRank,
    totalSplits: totalSplits ?? 0,
    weeklyTotalSplits: weeklyTotalSplits ?? 0,
  };
}

/** When venue name matches `bar_pub_stats.bar_key` (web loader). */
export async function fetchPubPageBarKeyFromBarName(barName: string | null | undefined): Promise<string | null> {
  const key = barName?.trim().toLowerCase();
  if (!key) return null;

  const { data, error } = await supabase.from('bar_pub_stats').select('bar_key').eq('bar_key', key).maybeSingle();

  if (error) throw error;
  return data?.bar_key ? String(data.bar_key) : null;
}

export async function fetchPourDetailData(pourRef: string): Promise<{
  score: PourScore | null;
  rank: PourRankContext | null;
  pubPageBarKey: string | null;
}> {
  const score = await fetchScoreByRef(pourRef);
  if (!score?.created_at || score.split_score == null) {
    return { score, rank: null, pubPageBarKey: null };
  }

  const [rank, pubPageBarKey] = await Promise.all([
    fetchPourRankContext(Number(score.split_score), score.created_at),
    fetchPubPageBarKeyFromBarName(score.bar_name),
  ]);

  return { score, rank, pubPageBarKey };
}

export type PourVenueUpdate = {
  bar_name: string;
  bar_address: string | null;
  google_place_id: string | null;
  pour_rating: number;
  pint_price: number | null;
} & Partial<{
  city: string | null;
  region: string | null;
  country: string | null;
  country_code: string | null;
}>;

export async function updatePourVenue(scoreId: string, patch: PourVenueUpdate): Promise<PourScore> {
  const { data, error } = await supabase
    .from('scores')
    .update(patch)
    .eq('id', scoreId)
    .select(SCORE_PUBLIC_SELECT)
    .single();

  if (error) throw error;
  return data as PourScore;
}

export async function attachScoreToCompetition(competitionId: string, scoreId: string): Promise<void> {
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError) throw userError;
  const uid = userData.user?.id;
  if (!uid) throw new Error('Sign in required to join the competition.');

  const { error } = await supabase.from('competition_scores').insert({
    competition_id: competitionId,
    score_id: scoreId,
    user_id: uid,
  });
  if (error) throw error;
}

export async function claimPourWithProfile(
  scoreId: string,
  email: string,
  leaderboardUsername: string,
): Promise<void> {
  const { error: upError } = await supabase
    .from('scores')
    .update({
      email,
      email_opted_out: false,
      username: leaderboardUsername,
    })
    .eq('id', scoreId);
  if (upError) throw upError;

  const { error: rpcError } = await supabase.rpc('sync_scores_username_for_jwt', {
    p_username: leaderboardUsername,
  });
  if (rpcError) throw rpcError;
}

export async function unclaimPourScore(scoreId: string): Promise<void> {
  const nextUsernameByClient = generateBeerUsername();
  const { error } = await supabase
    .from('scores')
    .update({
      email: null,
      username: nextUsernameByClient,
      email_opted_out: false,
    })
    .eq('id', scoreId);
  if (error) throw error;
}

import { fetchLeaderboardGlobal, type LeaderboardEntry } from './leaderboard';

function leaderboardEntryAsPourScore(e: LeaderboardEntry): PourScore {
  return {
    id: e.id,
    slug: e.slug ?? null,
    split_score: e.split_score,
    split_image_url: e.split_image_url,
    pint_image_url: null,
    g_closeup_image_url: null,
    username: e.username,
    city: null,
    region: null,
    country: null,
    country_code: e.country_code ?? null,
    created_at: e.created_at,
    bar_name: null,
    bar_address: null,
    google_place_id: null,
    pour_rating: null,
    pint_price: null,
    session_id: null,
    submitter_user_id: null,
    email: null,
    email_opted_out: null,
  };
}

export async function fetchLeaderboard(limit = 25): Promise<PourScore[]> {
  const rows = await fetchLeaderboardGlobal(Math.min(Math.max(limit, 1), 50));
  return rows.map(leaderboardEntryAsPourScore);
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

export async function fetchCompetitionParticipantCount(competitionId: string): Promise<number> {
  const { count, error } = await supabase
    .from('competition_participants')
    .select('*', { count: 'exact', head: true })
    .eq('competition_id', competitionId);

  if (error) return 0;
  return count ?? 0;
}

export async function updateCompetitionDetails(
  competitionId: string,
  patch: {
    title: string;
    max_participants: number;
    glasses_per_person: number;
    starts_at: string;
    ends_at: string;
    win_rule: string;
    target_score: number | null;
    visibility: string;
    location_name: string | null;
    location_address: string | null;
    linked_bar_key: string | null;
  },
): Promise<CompetitionDetail> {
  const { error } = await supabase.from('competitions').update(patch).eq('id', competitionId);
  if (error) throw error;
  const { data, error: rerr } = await supabase
    .from('competitions')
    .select(COMPETITION_DETAIL_SELECT)
    .eq('id', competitionId)
    .maybeSingle();
  if (rerr) throw rerr;
  if (!data) throw new Error('Competition not found after update.');
  return data as CompetitionDetail;
}

const BAR_STAT_SELECT =
  'bar_key, display_name, sample_address, google_place_id, avg_pour_rating, rating_count, submission_count';

/** Match web `PUB_WALL_PAGE_LIMIT` in `pubs.$barKey.shared.ts`. */
const PUB_WALL_PAGE_LIMIT = 120;

function numFromDb(v: unknown): number {
  if (v == null) return 0;
  const n = typeof v === 'number' ? v : Number.parseFloat(String(v));
  return Number.isFinite(n) ? n : 0;
}

/** Match web `pubs.$barKey.loader`: prefer `bar_pub_stats_mv`, then `bar_pub_stats`. */
export async function fetchPubByBarKey(barKey: string): Promise<PubSummary | null> {
  const key = barKey.trim().toLowerCase();
  if (!key) return null;

  let q = await supabase.from('bar_pub_stats_mv').select(BAR_STAT_SELECT).eq('bar_key', key).maybeSingle();
  if (q.error || !q.data) {
    q = await supabase.from('bar_pub_stats').select(BAR_STAT_SELECT).eq('bar_key', key).maybeSingle();
  }
  if (q.error) throw q.error;
  return (q.data ?? null) as PubSummary | null;
}

/**
 * Pub detail payload aligned with web `pubs.$barKey` loader: stats MV, wall RPC,
 * spend RPC, directory row, linked competitions, and optional favorite id.
 */
export async function fetchPubDetailPage(barKey: string, userId: string | null): Promise<PubDetailPageData | null> {
  const key = barKey.trim().toLowerCase();
  if (!key) return null;

  const bar = await fetchPubByBarKey(key);
  if (!bar) return null;

  const nowIso = new Date().toISOString();

  const [wallRes, extraRes, placeRes, compRes, favRes] = await Promise.all([
    supabase.rpc('pub_wall_scores', { p_bar_key: key, p_limit: PUB_WALL_PAGE_LIMIT }),
    supabase.rpc('pub_extra_stats_for_bar', { p_bar_key: key }),
    supabase
      .from('pub_place_details')
      .select(
        'bar_key, opening_hours, guinness_info, alcohol_promotions, maps_place_url, google_place_id, updated_at, updated_by',
      )
      .eq('bar_key', key)
      .maybeSingle(),
    supabase
      .from('competitions')
      .select('id, title, starts_at, ends_at, path_segment')
      .eq('linked_bar_key', key)
      .gt('ends_at', nowIso)
      .order('ends_at', { ascending: true }),
    userId
      ? supabase.from('user_favorite_bars').select('id, bar_name').eq('user_id', userId)
      : Promise.resolve({ data: [] as { id: string; bar_name: string }[], error: null }),
  ]);

  let wallPours: PubWallScoreRow[] = [];
  let wallError: string | null = null;
  if (wallRes.error) {
    const msg = `${wallRes.error.message ?? ''} ${wallRes.error.code ?? ''}`.toLowerCase();
    if (wallRes.error.code === '42883' || msg.includes('pub_wall_scores') || msg.includes('function')) {
      wallError =
        'Wall requires migration 20260328300000_pub_wall_scores_rpc (run Supabase migrations).';
    } else {
      wallError = wallRes.error.message ?? 'Could not load wall.';
    }
  } else {
    wallPours = (wallRes.data ?? []).map((row: Record<string, unknown>) => ({
      id: String(row.id ?? ''),
      slug: (row.slug as string | null | undefined) ?? null,
      username: (row.username as string | null) ?? '—',
      pint_image_url: (row.pint_image_url as string | null) ?? null,
      created_at: String(row.created_at ?? ''),
      split_score: numFromDb(row.split_score),
      bar_name: (row.bar_name as string | null | undefined) ?? null,
      bar_address: (row.bar_address as string | null | undefined) ?? null,
      city: (row.city as string | null | undefined) ?? null,
      region: (row.region as string | null | undefined) ?? null,
      country_code: (row.country_code as string | null | undefined) ?? null,
      pint_price: row.pint_price != null ? numFromDb(row.pint_price) : null,
    }));
  }

  let extra: PubExtraStatsRow = {
    distinct_drinkers: 0,
    total_pint_spend: 0,
    my_pint_spend: 0,
  };
  let extraError: string | null = null;
  if (extraRes.error) {
    extraError = extraRes.error.message;
  } else {
    const raw = (extraRes.data ?? [])[0] as
      | { distinct_drinkers?: unknown; total_pint_spend?: unknown; my_pint_spend?: unknown }
      | undefined;
    extra = {
      distinct_drinkers: Math.round(numFromDb(raw?.distinct_drinkers)),
      total_pint_spend: numFromDb(raw?.total_pint_spend),
      my_pint_spend: numFromDb(raw?.my_pint_spend),
    };
  }

  const placeDetails = !placeRes.error ? ((placeRes.data ?? null) as PubPlaceDetailsRow | null) : null;

  const linkedCompetitions: PubLinkedCompetitionRow[] = !compRes.error
    ? ((compRes.data ?? []) as PubLinkedCompetitionRow[])
    : [];

  let favId: string | null = null;
  if (userId && !favRes.error && favRes.data?.length) {
    const match = favRes.data.find((r) => r.bar_name.trim().toLowerCase() === key);
    favId = match?.id ?? null;
  }

  return {
    bar,
    wallPours,
    wallError,
    extra,
    extraError,
    placeDetails,
    linkedCompetitions,
    favId,
  };
}

export async function fetchPubs(limit = 50): Promise<PubSummary[]> {
  let q = await supabase
    .from('bar_pub_stats_mv')
    .select(BAR_STAT_SELECT)
    .order('rating_count', { ascending: false })
    .limit(limit);
  if (q.error) {
    q = await supabase
      .from('bar_pub_stats')
      .select(BAR_STAT_SELECT)
      .order('rating_count', { ascending: false })
      .limit(limit);
  }
  if (q.error) throw q.error;
  return (q.data ?? []) as PubSummary[];
}

export function absoluteWebUrl(path: string): string {
  if (/^https?:\/\//i.test(path)) return path;
  return `${appConfig.siteUrl}${path.startsWith('/') ? path : `/${path}`}`;
}
