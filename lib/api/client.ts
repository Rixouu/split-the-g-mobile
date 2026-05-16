import { appConfig } from '@/lib/config';
import { competitionDetailWebPath } from '@/lib/competition/competition-web-path';
import { normalizeEmail } from '@/lib/competition/detail-helpers';
import { postFriendInviteEmail } from '@/lib/competition/web-invite-bridge';
import { generateBeerUsername } from '@/lib/utils/username-generator';
import { supabase } from '@/lib/supabase/client';

import type {
  BarLinkOption,
  CompetitionDetail,
  CompetitionInviteRow,
  CompetitionSummary,
  FriendPick,
  ParticipantProfilePick,
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
import {
  COMPETITION_SCORES_SELECT,
  COMPETITION_SCORE_LIMIT,
  type CompetitionScoreJoin,
} from '@/lib/competition/leaderboard';

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

export interface CompetitionsCatalogPayload {
  competitions: CompetitionDetail[];
  listError: string | null;
  participantCounts: Record<string, number>;
}

/** Mirrors web `competitions.loader.ts` — RLS governs visibility. */
export async function fetchCompetitionsCatalog(limit = 40): Promise<CompetitionsCatalogPayload> {
  const { data, error } = await supabase
    .from('competitions')
    .select(COMPETITION_DETAIL_SELECT)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    return { competitions: [], listError: error.message, participantCounts: {} };
  }

  const competitions = (data ?? []) as CompetitionDetail[];
  const ids = competitions.map((c) => c.id);
  const participantCounts: Record<string, number> = {};

  if (ids.length > 0) {
    const { data: parts } = await supabase
      .from('competition_participants')
      .select('competition_id')
      .in('competition_id', ids);
    for (const row of parts ?? []) {
      const id = row.competition_id as string;
      participantCounts[id] = (participantCounts[id] ?? 0) + 1;
    }
  }

  return { competitions, listError: null, participantCounts };
}

export async function fetchBarLinkOptions(): Promise<BarLinkOption[]> {
  const { data } = await supabase
    .from('bar_pub_stats')
    .select('bar_key, display_name')
    .order('submission_count', { ascending: false })
    .limit(200);
  return (data ?? []) as BarLinkOption[];
}

export async function fetchUserJoinedOwnedCompetitions(userId: string): Promise<CompetitionDetail[]> {
  const { data: rows } = await supabase
    .from('competition_participants')
    .select('competition_id')
    .eq('user_id', userId);
  const joinedIds = (rows ?? []).map((r) => r.competition_id as string);

  const { data: owned } = await supabase.from('competitions').select('id').eq('created_by', userId);
  const ownedIds = (owned ?? []).map((r) => r.id as string);

  const idSet = new Set<string>([...joinedIds, ...ownedIds]);
  if (idSet.size === 0) return [];

  const { data: comps } = await supabase
    .from('competitions')
    .select(COMPETITION_DETAIL_SELECT)
    .in('id', [...idSet]);
  return (comps ?? []) as CompetitionDetail[];
}

export async function fillParticipantCountsForCompetitionIds(
  competitionIds: string[],
): Promise<Record<string, number>> {
  if (competitionIds.length === 0) return {};
  const { data } = await supabase
    .from('competition_participants')
    .select('competition_id')
    .in('competition_id', competitionIds);
  const next: Record<string, number> = {};
  for (const row of data ?? []) {
    const id = row.competition_id as string;
    next[id] = (next[id] ?? 0) + 1;
  }
  return next;
}

export async function fetchUserFriendsForInvites(userId: string): Promise<FriendPick[]> {
  const { data } = await supabase
    .from('user_friends')
    .select('friend_user_id, peer_email')
    .eq('user_id', userId);
  return (data ?? []) as FriendPick[];
}

export async function fetchCompetitionInvitesByCompetitionIds(
  competitionIds: string[],
): Promise<Record<string, CompetitionInviteRow[]>> {
  if (competitionIds.length === 0) return {};
  const { data } = await supabase
    .from('competition_invites')
    .select('id, competition_id, invited_email')
    .in('competition_id', competitionIds);
  const next: Record<string, CompetitionInviteRow[]> = {};
  for (const row of data ?? []) {
    const cid = row.competition_id as string;
    if (!next[cid]) next[cid] = [];
    next[cid].push({ id: row.id as string, invited_email: String(row.invited_email) });
  }
  return next;
}

export async function fetchInvitedCompetitionTitles(
  email: string,
): Promise<{ competition_id: string; title: string }[]> {
  const normalized = email.trim().toLowerCase();
  const { data: invites } = await supabase
    .from('competition_invites')
    .select('competition_id')
    .eq('invited_email', normalized);
  if (!invites?.length) return [];
  const ids = [...new Set(invites.map((i) => i.competition_id as string))];
  const { data: comps } = await supabase.from('competitions').select('id, title').in('id', ids);
  return (comps ?? []).map((c) => ({ competition_id: c.id as string, title: String(c.title) }));
}

export async function joinCompetitionAsUser(competitionId: string, userId: string): Promise<void> {
  const { error } = await supabase.from('competition_participants').insert({
    competition_id: competitionId,
    user_id: userId,
  });
  if (error) throw error;
}

export async function leaveCompetitionAsUser(competitionId: string, userId: string): Promise<void> {
  const { error } = await supabase
    .from('competition_participants')
    .delete()
    .eq('competition_id', competitionId)
    .eq('user_id', userId);
  if (error) throw error;
}

export async function deleteCompetitionById(competitionId: string): Promise<void> {
  const { error } = await supabase.from('competitions').delete().eq('id', competitionId);
  if (error) throw error;
}

export async function submitCompetitionInviteRow(row: {
  competition_id: string;
  invited_email: string;
  invited_by: string;
}): Promise<void> {
  const { error } = await supabase.from('competition_invites').insert(row);
  if (error) throw error;
}

export async function removeCompetitionInvite(inviteId: string): Promise<void> {
  const { error } = await supabase.from('competition_invites').delete().eq('id', inviteId);
  if (error) throw error;
}

export async function addUserToCompetitionAsParticipant(
  competitionId: string,
  participantUserId: string,
): Promise<void> {
  const { error } = await supabase.from('competition_participants').insert({
    competition_id: competitionId,
    user_id: participantUserId,
  });
  if (error) throw error;
}

export async function fetchCompetitionScoresJoined(
  competitionId: string,
): Promise<CompetitionScoreJoin[]> {
  const { data } = await supabase
    .from('competition_scores')
    .select(COMPETITION_SCORES_SELECT)
    .eq('competition_id', competitionId)
    .order('created_at', { ascending: false })
    .limit(COMPETITION_SCORE_LIMIT);
  return (data ?? []) as CompetitionScoreJoin[];
}

export async function createCompetitionRow(payload: {
  title: string;
  created_by: string;
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
}): Promise<{ id: string; path_segment: string | null }> {
  const { data, error } = await supabase
    .from('competitions')
    .insert(payload)
    .select('id, path_segment')
    .single();
  if (error) throw error;
  return data as { id: string; path_segment: string | null };
}

export async function fetchCompetitionParticipantUserIds(competitionId: string): Promise<string[]> {
  const { data } = await supabase
    .from('competition_participants')
    .select('user_id')
    .eq('competition_id', competitionId);
  return [...new Set((data ?? []).map((r) => r.user_id as string).filter(Boolean))];
}

/** Most recent competition pour per user → email when claimed on a score (mirrors web roster hints). */
export async function fetchParticipantEmailsFromCompetitionScores(
  competitionId: string,
): Promise<Record<string, string>> {
  const { data, error } = await supabase
    .from('competition_scores')
    .select('user_id, created_at, scores(email)')
    .eq('competition_id', competitionId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  const out: Record<string, string> = {};
  for (const row of data ?? []) {
    const uid = row.user_id as string | null;
    if (!uid || out[uid]) continue;
    const raw = row.scores as { email?: string | null } | { email?: string | null }[] | null;
    const score = Array.isArray(raw) ? raw[0] : raw;
    const em = score?.email?.trim();
    if (em && em.includes('@')) out[uid] = normalizeEmail(em);
  }
  return out;
}

export async function sendFriendInviteToPeer(params: {
  fromUserId: string;
  fromEmail: string | null;
  inviterName: string | null;
  peerEmail: string;
  competition: { id: string; path_segment: string | null; title: string | null } | null;
}): Promise<void> {
  const to = normalizeEmail(params.peerEmail);
  if (!to.includes('@')) throw new Error('Invalid email');
  await insertFriendRequestRow({
    from_user_id: params.fromUserId,
    to_email: to,
    from_email: params.fromEmail ?? null,
    status: 'pending',
  });
  const invitePath = params.competition
    ? competitionDetailWebPath(params.competition)
    : '/competitions';
  try {
    await postFriendInviteEmail({
      inviterEmail: params.fromEmail,
      inviterName: params.inviterName,
      toEmail: to,
      invitePath,
      competitionTitle: params.competition?.title ?? null,
    });
  } catch {
    // Email helper is best-effort; DB row is source of truth.
  }
}

export async function fetchPublicProfilesMap(
  userIds: string[],
): Promise<Record<string, ParticipantProfilePick>> {
  if (userIds.length === 0) return {};
  const { data } = await supabase
    .from('public_profiles')
    .select('user_id, nickname, display_name, country_code')
    .in('user_id', userIds);
  const next: Record<string, ParticipantProfilePick> = {};
  for (const row of data ?? []) {
    const uid = row.user_id as string;
    next[uid] = {
      nickname: row.nickname as string | null,
      display_name: row.display_name as string | null,
      country_code: row.country_code != null ? String(row.country_code).trim() : null,
    };
  }
  return next;
}

export async function fetchFriendRowsBidirectional(
  userId: string,
): Promise<{ user_id: string; friend_user_id: string }[]> {
  const { data } = await supabase
    .from('user_friends')
    .select('user_id, friend_user_id')
    .or(`user_id.eq.${userId},friend_user_id.eq.${userId}`);
  return (data ?? []) as { user_id: string; friend_user_id: string }[];
}

export async function fetchPendingFriendRequestEmails(fromUserId: string): Promise<string[]> {
  const { data } = await supabase
    .from('friend_requests')
    .select('to_email')
    .eq('from_user_id', fromUserId)
    .eq('status', 'pending');
  return (data ?? [])
    .map((r) => String(r.to_email ?? '').trim().toLowerCase())
    .filter(Boolean);
}

export async function insertFriendRequestRow(row: {
  from_user_id: string;
  to_email: string;
  from_email: string | null;
  status: string;
}): Promise<void> {
  const { error } = await supabase.from('friend_requests').insert(row);
  if (error) throw error;
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

function coordPairFromDb(lat: unknown, lng: unknown): { lat: number; lng: number } | null {
  if (lat == null || lng == null) return null;
  const a = typeof lat === 'number' ? lat : Number.parseFloat(String(lat));
  const b = typeof lng === 'number' ? lng : Number.parseFloat(String(lng));
  if (!Number.isFinite(a) || !Number.isFinite(b)) return null;
  return { lat: a, lng: b };
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
        'bar_key, opening_hours, guinness_info, alcohol_promotions, maps_place_url, google_place_id, latitude, longitude, updated_at, updated_by',
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
  const rows = (q.data ?? []) as PubSummary[];
  if (rows.length === 0) return rows;

  const keys = rows.map((r) => r.bar_key);
  const det = await supabase
    .from('pub_place_details')
    .select('bar_key, latitude, longitude, maps_place_url, google_place_id')
    .in('bar_key', keys);
  if (det.error) return rows;

  const byKey = new Map(
    (det.data ?? []).map((d) => {
      const row = d as {
        bar_key: string;
        latitude: unknown;
        longitude: unknown;
        maps_place_url: string | null;
        google_place_id: string | null;
      };
      return [row.bar_key, row] as const;
    }),
  );

  return rows.map((r) => {
    const extra = byKey.get(r.bar_key);
    if (!extra) return r;
    const pair = coordPairFromDb(extra.latitude, extra.longitude);
    const placeId = (r.google_place_id ?? '').trim() || (extra.google_place_id ?? '').trim() || null;
    return {
      ...r,
      maps_place_url: extra.maps_place_url ?? null,
      directory_latitude: pair?.lat ?? null,
      directory_longitude: pair?.lng ?? null,
      google_place_id: placeId,
    };
  });
}

export function absoluteWebUrl(path: string): string {
  if (/^https?:\/\//i.test(path)) return path;
  return `${appConfig.siteUrl}${path.startsWith('/') ? path : `/${path}`}`;
}
