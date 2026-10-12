import type { User } from '@supabase/supabase-js';
import type { QueryClient } from '@tanstack/react-query';

import {
  fetchPublicProfile,
  type FavoriteRow,
  type MyScoreRow,
} from '@/lib/api/profile';
import { favoriteRowsQueryOptions, myScoresQueryOptions, publicProfileQueryOptions } from '@/lib/queries/profile';

export interface ProfileHubBundle {
  scores: MyScoreRow[];
  favorites: FavoriteRow[];
  publicProfile: Awaited<ReturnType<typeof fetchPublicProfile>>;
}

export async function fetchProfileHubBundle(user: User, queryClient: QueryClient): Promise<ProfileHubBundle> {
  const email = user.email?.trim();
  if (!email) throw new Error('User email required for profile hub');

  const [scores, publicProfile, favorites] = await Promise.all([
    queryClient.fetchQuery(myScoresQueryOptions(user.id, email)),
    queryClient.fetchQuery(publicProfileQueryOptions(user.id)),
    queryClient.fetchQuery(favoriteRowsQueryOptions(user.id)),
  ]);

  return {
    scores,
    favorites,
    publicProfile,
  };
}
