import { supabase } from '@/lib/supabase/client';
import type { ComparisonScoreRow } from '@/lib/profile/profile-leaderboard';

import { emailDisplayName, escapeIlikePattern, normalizeEmail } from '@/lib/utils/profile-email';

export interface MyScoreRow {
  id: string;
  slug?: string | null;
  split_score: number;
  created_at: string;
  bar_name: string | null;
  pint_price?: number | null;
}

export interface FavoriteRow {
  id: string;
  bar_name: string;
  bar_address: string | null;
  created_at: string;
}

export interface FavoriteBarStats {
  avg: number;
  count: number;
}

export function barKey(name: string, address?: string | null): string {
  return `${name.trim().toLowerCase()}::${(address ?? '').trim().toLowerCase()}`;
}

export function favoriteMapsUrl(f: FavoriteRow): string {
  const q = [f.bar_name, f.bar_address].filter(Boolean).join(' ');
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}`;
}

/** Aggregate pour counts / avg split by bar name (+ optional address), matching web profile favorites. */
export async function fetchFavoriteBarStats(favorites: FavoriteRow[]): Promise<Record<string, FavoriteBarStats>> {
  if (favorites.length === 0) return {};
  const favoriteNames = [...new Set(favorites.map((f) => f.bar_name))];
  const { data: ratingRows, error } = await supabase
    .from('scores')
    .select('bar_name, bar_address, split_score')
    .in('bar_name', favoriteNames);
  if (error) throw error;
  return (ratingRows ?? []).reduce<Record<string, FavoriteBarStats>>((acc, row) => {
    const name = String((row as { bar_name?: string }).bar_name ?? '').trim();
    if (!name) return acc;
    const addr = (row as { bar_address?: string | null }).bar_address ?? null;
    const keys = [barKey(name, addr), barKey(name)];
    for (const key of keys) {
      const current = acc[key] ?? { avg: 0, count: 0 };
      const nextCount = current.count + 1;
      acc[key] = {
        avg: (current.avg * current.count + Number((row as { split_score?: number }).split_score ?? 0)) / nextCount,
        count: nextCount,
      };
    }
    return acc;
  }, {});
}

export interface FriendRequestRow {
  id: string;
  from_user_id: string;
  to_email: string;
  from_email: string | null;
  status: string;
  created_at: string;
}

export interface UserFriendRow {
  user_id: string;
  friend_user_id: string;
  peer_email: string | null;
  created_at: string;
}

export async function fetchMyScores(userEmail: string): Promise<MyScoreRow[]> {
  const emailTrim = userEmail.trim();
  const pattern = escapeIlikePattern(emailTrim);
  const { data: scoreRows, error: scoresQerr } = await supabase
    .from('scores')
    .select('id, slug, split_score, created_at, bar_name, pint_price')
    .ilike('email', pattern)
    .order('created_at', { ascending: false })
    .limit(80);

  if (!scoresQerr && scoreRows?.length) {
    return scoreRows as MyScoreRow[];
  }

  const { data: fallbackRows, error: fbErr } = await supabase
    .from('scores')
    .select('id, slug, split_score, created_at, bar_name, pint_price')
    .eq('email', emailTrim)
    .order('created_at', { ascending: false })
    .limit(80);

  if (fbErr) throw fbErr;
  return (fallbackRows ?? scoreRows ?? []) as MyScoreRow[];
}

export async function fetchMyAchievementCodes(userId: string): Promise<string[]> {
  const { data, error } = await supabase.from('user_achievements').select('code').eq('user_id', userId);
  if (error) return [];
  return (data ?? [])
    .map((r) => String((r as { code?: string }).code ?? '').trim())
    .filter(Boolean);
}

export async function fetchUserStreakSnapshot(
  userId: string,
): Promise<{ daily: number; weekend: number; weekly: number } | null> {
  const { data, error } = await supabase
    .from('user_streak_snapshots')
    .select('daily_streak, weekly_streak, weekend_streak')
    .eq('user_id', userId)
    .maybeSingle();
  if (error || !data) return null;
  const r = data as {
    daily_streak?: number | null;
    weekly_streak?: number | null;
    weekend_streak?: number | null;
  };
  return {
    daily: Number(r.daily_streak ?? 0),
    weekly: Number(r.weekly_streak ?? 0),
    weekend: Number(r.weekend_streak ?? 0),
  };
}

export async function fetchFavoriteRows(userId: string): Promise<FavoriteRow[]> {
  const { data, error } = await supabase
    .from('user_favorite_bars')
    .select('id, bar_name, bar_address, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []) as FavoriteRow[];
}

export async function insertFavoriteBar(userId: string, barName: string, barAddress: string | null): Promise<void> {
  const { error } = await supabase.from('user_favorite_bars').insert({
    user_id: userId,
    bar_name: barName.trim(),
    bar_address: barAddress?.trim() || null,
  });
  if (error) throw error;
}

export async function deleteFavoriteBar(id: string): Promise<void> {
  const { error } = await supabase.from('user_favorite_bars').delete().eq('id', id);
  if (error) throw error;
}

export async function loadSocial(userId: string, userEmail: string | null) {
  const emailNorm = userEmail ? normalizeEmail(userEmail) : '';

  const outRes = await supabase
    .from('friend_requests')
    .select('id, from_user_id, to_email, from_email, status, created_at')
    .eq('from_user_id', userId)
    .eq('status', 'pending')
    .order('created_at', { ascending: false });

  const incRes = emailNorm
    ? await supabase
        .from('friend_requests')
        .select('id, from_user_id, to_email, from_email, status, created_at')
        .eq('to_email', emailNorm)
        .eq('status', 'pending')
        .order('created_at', { ascending: false })
    : { data: [] as FriendRequestRow[], error: null };

  const frRes = await supabase
    .from('user_friends')
    .select('user_id, friend_user_id, peer_email, created_at')
    .or(`user_id.eq.${userId},friend_user_id.eq.${userId}`);

  if (outRes.error) throw outRes.error;
  if ('error' in incRes && incRes.error) throw incRes.error;
  if (frRes.error) throw frRes.error;

  const outgoing = (outRes.data ?? []) as FriendRequestRow[];
  const incomingAll = (incRes.data ?? []) as FriendRequestRow[];
  const incoming = incomingAll.filter((r) => r.from_user_id !== userId);
  const friends = (frRes.data ?? []) as UserFriendRow[];

  return { outgoing, incoming, friends };
}

/** Loads score rows + display labels for the signed-in user and accepted friends (matches web `loadFriendComparison`). */
export async function loadFriendComparisonScores(
  userId: string,
  userEmail: string | null,
  friends: UserFriendRow[],
): Promise<{ scores: ComparisonScoreRow[]; labels: Record<string, string> }> {
  if (!userEmail?.trim()) {
    return { scores: [], labels: {} };
  }

  const norm = normalizeEmail(userEmail);
  const ownFriendRows = friends.filter((row) => row.user_id === userId);
  const comparisonEmails = [
    norm,
    ...ownFriendRows
      .map((row) => row.peer_email?.trim())
      .filter((value): value is string => Boolean(value))
      .map(normalizeEmail),
  ];
  const uniqueEmails = [...new Set(comparisonEmails)].filter(Boolean);
  const friendUserIds = ownFriendRows.map((row) => row.friend_user_id);
  const profileIds = [...new Set([userId, ...friendUserIds])];

  if (uniqueEmails.length === 0) {
    return { scores: [], labels: {} };
  }

  const { data: scoreRows } = await supabase
    .from('scores')
    .select('email, username, split_score, created_at')
    .in('email', uniqueEmails)
    .order('created_at', { ascending: false })
    .limit(500);

  const profileRes = await supabase
    .from('public_profiles')
    .select('user_id, display_name, nickname')
    .in('user_id', profileIds);

  type ProfilePick = { user_id: string; display_name: string | null; nickname: string | null };
  let profileRows = (profileRes.data ?? []) as ProfilePick[];
  if (profileRes.error) {
    const fallback = await supabase
      .from('public_profiles')
      .select('user_id, display_name')
      .in('user_id', profileIds);
    profileRows = (fallback.data ?? []) as ProfilePick[];
  }

  const profileByUserId = new Map(profileRows.map((row) => [row.user_id, row]));
  const labels: Record<string, string> = {};
  labels[norm] =
    profileByUserId.get(userId)?.nickname?.trim() ||
    profileByUserId.get(userId)?.display_name?.trim() ||
    emailDisplayName(userEmail);

  for (const row of ownFriendRows) {
    const peerEmail = row.peer_email?.trim();
    if (!peerEmail) continue;
    const profile = profileByUserId.get(row.friend_user_id);
    labels[normalizeEmail(peerEmail)] =
      profile?.nickname?.trim() || profile?.display_name?.trim() || emailDisplayName(peerEmail);
  }

  return {
    scores: (scoreRows ?? []) as ComparisonScoreRow[],
    labels,
  };
}

export async function sendFriendInvite(params: {
  fromUserId: string;
  fromEmail: string | null;
  toEmail: string;
}): Promise<void> {
  const to = normalizeEmail(params.toEmail);
  if (!to.includes('@')) throw new Error('Invalid email');
  const { error } = await supabase.from('friend_requests').insert({
    from_user_id: params.fromUserId,
    to_email: to,
    from_email: params.fromEmail ?? null,
    status: 'pending',
  });
  if (error) throw error;
}

export async function respondFriendRequest(
  row: FriendRequestRow,
  status: 'accepted' | 'declined',
  accepterUserId: string,
  accepterEmail: string | null,
): Promise<void> {
  const { error: uerr } = await supabase.from('friend_requests').update({ status }).eq('id', row.id);
  if (uerr) throw uerr;
  if (status !== 'accepted') return;

  const requesterEmail = row.from_email ?? null;
  const pair = [
    { user_id: row.from_user_id, friend_user_id: accepterUserId, peer_email: accepterEmail },
    { user_id: accepterUserId, friend_user_id: row.from_user_id, peer_email: requesterEmail },
  ] as const;
  for (const rowFriend of pair) {
    const { error: insErr } = await supabase.from('user_friends').upsert(rowFriend, {
      onConflict: 'user_id,friend_user_id',
      ignoreDuplicates: true,
    });
    if (insErr) throw insErr;
  }
}

export async function withdrawFriendRequest(requestId: string, fromUserId: string): Promise<void> {
  const { error } = await supabase
    .from('friend_requests')
    .update({ status: 'withdrawn' })
    .eq('id', requestId)
    .eq('from_user_id', fromUserId)
    .eq('status', 'pending');
  if (error) throw error;
}

export async function removeFriendPair(userId: string, otherUserId: string): Promise<void> {
  await supabase.from('user_friends').delete().eq('user_id', userId).eq('friend_user_id', otherUserId);
  await supabase.from('user_friends').delete().eq('user_id', otherUserId).eq('friend_user_id', userId);
}

export interface PublicProfileFields {
  display_name: string | null;
  nickname: string | null;
  country_code: string | null;
}

export async function fetchPublicProfile(userId: string): Promise<PublicProfileFields | null> {
  const { data, error } = await supabase
    .from('public_profiles')
    .select('display_name, nickname, country_code')
    .eq('user_id', userId)
    .maybeSingle();
  if (error) return null;
  if (!data) return null;
  return {
    display_name: (data as { display_name?: string | null }).display_name ?? null,
    nickname: (data as { nickname?: string | null }).nickname ?? null,
    country_code: (data as { country_code?: string | null }).country_code ?? null,
  };
}

export async function upsertPublicProfile(
  userId: string,
  fields: { display_name: string; nickname: string | null; country_code: string | null },
): Promise<void> {
  const { error } = await supabase.from('public_profiles').upsert(
    {
      user_id: userId,
      display_name: fields.display_name.trim(),
      nickname: fields.nickname?.trim() || null,
      country_code: fields.country_code?.trim().toUpperCase() || null,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'user_id' },
  );
  if (error) throw error;
}
