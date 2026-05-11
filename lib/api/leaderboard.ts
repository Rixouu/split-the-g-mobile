import { supabase } from '@/lib/supabase/client';

/** Match web [`SCORES_LEADERBOARD_COLUMNS`](split-the-g/app/utils/scoresListColumns.ts). */
export const LEADERBOARD_SCORE_COLUMNS =
  'id, slug, username, split_score, created_at, split_image_url, country_code';

export interface LeaderboardEntry {
  id: string;
  slug?: string | null;
  username: string;
  split_score: number;
  created_at: string;
  split_image_url: string;
  country_code?: string | null;
}

export interface CountryStatRow {
  country: string;
  country_code: string;
  submission_count: number;
  average_score: number;
}

export function weekAgoIso(): string {
  const d = new Date();
  d.setDate(d.getDate() - 7);
  return d.toISOString();
}

function mapRows(data: unknown): LeaderboardEntry[] {
  if (!Array.isArray(data)) return [];
  return data as LeaderboardEntry[];
}

function isRpcMissingError(error: { message?: string; code?: string } | null): boolean {
  if (!error) return false;
  const hint = `${error.message ?? ''} ${error.code ?? ''}`.toLowerCase();
  return error.code === '42883' || hint.includes('function');
}

export async function fetchProfileCountryCode(userId: string): Promise<string | null> {
  const { data, error } = await supabase
    .from('public_profiles')
    .select('country_code')
    .eq('user_id', userId)
    .maybeSingle();
  if (error) return null;
  const c = data?.country_code?.trim();
  return c ? c.toUpperCase() : null;
}

export async function fetchLeaderboardGlobal(limit = 15): Promise<LeaderboardEntry[]> {
  const since = weekAgoIso();

  const { data, error } = await supabase.rpc('leaderboard_scores_global', {
    p_since: since,
    p_limit: limit,
  });

  if (!error && data) {
    return mapRows(data);
  }

  if (error && !isRpcMissingError(error)) {
    throw Object.assign(new Error(error.message ?? 'Leaderboard error'), { cause: error });
  }

  const { data: fb, error: fbError } = await supabase
    .from('scores')
    .select(LEADERBOARD_SCORE_COLUMNS)
    .gte('created_at', since)
    .not('split_score', 'is', null)
    .order('split_score', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(limit);

  if (fbError) throw fbError;
  return mapRows(fb);
}

export async function fetchLeaderboardForCountry(countryCode: string, limit = 15): Promise<LeaderboardEntry[]> {
  const since = weekAgoIso();
  const code = countryCode.trim().toUpperCase();

  const { data, error } = await supabase.rpc('leaderboard_scores_for_country', {
    p_country: code,
    p_since: since,
    p_limit: limit,
  });

  if (!error && data) {
    return mapRows(data);
  }

  if (error && !isRpcMissingError(error)) {
    throw Object.assign(new Error(error.message ?? 'Leaderboard error'), { cause: error });
  }

  return [];
}

function normalizeEmail(value: string | null | undefined): string {
  return (value ?? '').trim().toLowerCase();
}

export async function fetchLeaderboardForFriends(userId: string, userEmail: string | null, limit = 15): Promise<LeaderboardEntry[]> {
  const since = weekAgoIso();
  const emailSet = new Set<string>();
  const norm = normalizeEmail(userEmail);
  if (norm) emailSet.add(norm);

  const { data: fr, error: frErr } = await supabase
    .from('user_friends')
    .select('user_id, friend_user_id, peer_email')
    .or(`user_id.eq.${userId},friend_user_id.eq.${userId}`);

  if (frErr) {
    throw frErr;
  }

  for (const row of fr ?? []) {
    const peer = row.peer_email?.trim();
    if (peer) emailSet.add(normalizeEmail(peer));
  }

  const emails = [...emailSet];
  if (emails.length === 0) {
    return [];
  }

  const { data, error } = await supabase.rpc('leaderboard_scores_for_emails', {
    p_emails: emails,
    p_since: since,
    p_limit: limit,
  });

  if (!error && data) {
    return mapRows(data);
  }

  if (error && !isRpcMissingError(error)) {
    throw Object.assign(new Error(error.message ?? 'Leaderboard error'), { cause: error });
  }

  return [];
}

export async function fetchCountryStatsAllTime(): Promise<CountryStatRow[]> {
  const { data, error } = await supabase.rpc('get_country_stats_all_time');
  if (error) {
    if (isRpcMissingError(error)) return [];
    throw error;
  }
  return (data ?? []) as CountryStatRow[];
}

export async function fetchCountryStats24h(): Promise<CountryStatRow[]> {
  const { data, error } = await supabase.rpc('get_country_stats_24h');
  if (error) {
    if (isRpcMissingError(error)) return [];
    throw error;
  }
  return (data ?? []) as CountryStatRow[];
}
