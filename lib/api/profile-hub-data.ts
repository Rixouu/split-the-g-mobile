import type { User } from '@supabase/supabase-js';

import {
  fetchFavoriteRows,
  fetchMyScores,
  fetchPublicProfile,
  type FavoriteRow,
  type MyScoreRow,
} from '@/lib/api/profile';

export interface ProfileHubBundle {
  scores: MyScoreRow[];
  favorites: FavoriteRow[];
  publicProfile: Awaited<ReturnType<typeof fetchPublicProfile>>;
}

export async function fetchProfileHubBundle(user: User): Promise<ProfileHubBundle> {
  const email = user.email?.trim();
  if (!email) throw new Error('User email required for profile hub');

  const [scores, publicProfile, favorites] = await Promise.all([
    fetchMyScores(email),
    fetchPublicProfile(user.id),
    fetchFavoriteRows(user.id),
  ]);

  return {
    scores,
    favorites,
    publicProfile,
  };
}
