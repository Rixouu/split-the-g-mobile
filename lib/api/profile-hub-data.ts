import type { User } from '@supabase/supabase-js';

import {
  fetchFavoriteRows,
  fetchMyAchievementCodes,
  fetchMyScores,
  fetchPublicProfile,
  fetchUserStreakSnapshot,
  loadSocial,
  type FavoriteRow,
  type MyScoreRow,
  type UserFriendRow,
} from '@/lib/api/profile';
import type { ComparisonScoreRow } from '@/lib/profile/profile-leaderboard';
import { supabase } from '@/lib/supabase/client';
import { emailDisplayName, normalizeEmail } from '@/lib/utils/profile-email';

type PublicProfileRow = {
  user_id: string;
  display_name: string | null;
  nickname?: string | null;
};

async function loadFriendComparison(
  user: User,
  ownFriendRows: UserFriendRow[],
  displayNameFallback: string,
): Promise<{ rows: ComparisonScoreRow[]; labels: Record<string, string> }> {
  if (!user.email) {
    return { rows: [], labels: {} };
  }

  const comparisonEmails = [
    normalizeEmail(user.email),
    ...ownFriendRows
      .map((row) => row.peer_email?.trim())
      .filter((value): value is string => Boolean(value))
      .map(normalizeEmail),
  ];
  const uniqueEmails = [...new Set(comparisonEmails)].filter(Boolean);
  const friendUserIds = ownFriendRows.map((row) => row.friend_user_id);
  const profileIds = [...new Set([user.id, ...friendUserIds])];

  if (uniqueEmails.length === 0) {
    return { rows: [], labels: {} };
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

  let profileRows = (profileRes.data ?? []) as PublicProfileRow[];
  if (profileRes.error) {
    const fallback = await supabase.from('public_profiles').select('user_id, display_name').in('user_id', profileIds);
    profileRows = (fallback.data ?? []) as PublicProfileRow[];
  }

  const profileByUserId = new Map(profileRows.map((row) => [row.user_id, row]));
  const labels: Record<string, string> = {};
  labels[normalizeEmail(user.email)] =
    profileByUserId.get(user.id)?.nickname?.trim() ||
    profileByUserId.get(user.id)?.display_name?.trim() ||
    displayNameFallback.trim() ||
    emailDisplayName(user.email);

  for (const row of ownFriendRows) {
    const peerEmail = row.peer_email?.trim();
    if (!peerEmail) continue;
    const profile = profileByUserId.get(row.friend_user_id);
    labels[normalizeEmail(peerEmail)] =
      profile?.nickname?.trim() ||
      profile?.display_name?.trim() ||
      emailDisplayName(peerEmail);
  }

  return {
    labels,
    rows: (scoreRows ?? []) as ComparisonScoreRow[],
  };
}

export interface ProfileHubBundle {
  scores: MyScoreRow[];
  favorites: FavoriteRow[];
  acceptedFriends: UserFriendRow[];
  outgoingFriendPendingCount: number;
  incomingFriendRequestCount: number;
  achievementCodes: string[];
  streakSnapshot: { daily: number; weekend: number; weekly: number } | null;
  comparisonScores: ComparisonScoreRow[];
  comparisonLabels: Record<string, string>;
  publicProfile: Awaited<ReturnType<typeof fetchPublicProfile>>;
}

export async function fetchProfileHubBundle(user: User): Promise<ProfileHubBundle> {
  const email = user.email?.trim();
  if (!email) {
    throw new Error('User email required for profile hub');
  }

  const [
    scores,
    publicProfile,
    social,
    favorites,
    achievementCodes,
    streakSnapshot,
  ] = await Promise.all([
    fetchMyScores(email),
    fetchPublicProfile(user.id),
    loadSocial(user.id, user.email ?? null),
    fetchFavoriteRows(user.id),
    fetchMyAchievementCodes(user.id),
    fetchUserStreakSnapshot(user.id),
  ]);

  const ownFriendRows = social.friends.filter((f) => f.user_id === user.id);
  const displayNameFallback =
    publicProfile?.display_name?.trim() || publicProfile?.nickname?.trim() || '';

  const { rows: comparisonScores, labels: comparisonLabels } = await loadFriendComparison(
    user,
    ownFriendRows,
    displayNameFallback,
  );

  return {
    scores,
    favorites,
    acceptedFriends: ownFriendRows,
    outgoingFriendPendingCount: social.outgoing.length,
    incomingFriendRequestCount: social.incoming.length,
    achievementCodes,
    streakSnapshot,
    comparisonScores,
    comparisonLabels,
    publicProfile,
  };
}
