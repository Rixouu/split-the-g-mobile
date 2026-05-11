import { supabase } from '@/lib/supabase/client';

import { escapeIlikePattern, normalizeEmail } from '@/lib/utils/profile-email';

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
