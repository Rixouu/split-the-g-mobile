import { queryOptions } from '@tanstack/react-query';

import { fetchFavoriteRows, fetchMyScores, fetchPublicProfile } from '@/lib/api/profile';
import { fetchPubNotes } from '@/lib/api/pub-notebook';
import { readGuestNotebook } from '@/lib/pub/guest-notebook';

export function favoriteRowsQueryOptions(userId?: string) {
  return queryOptions({
    queryKey: ['favorites', userId ?? 'guest'],
    queryFn: () => userId ? fetchFavoriteRows(userId) : readGuestNotebook().then((data) => data.favorites),
    networkMode: userId ? 'online' : 'always',
    staleTime: 120_000,
  });
}

export function pubNotesQueryOptions(userId?: string) {
  return queryOptions({
    queryKey: ['pub-notes', userId ?? 'guest'],
    queryFn: () => userId ? fetchPubNotes(userId) : readGuestNotebook().then((data) => data.notes),
    networkMode: userId ? 'online' : 'always',
    staleTime: 120_000,
  });
}

export function myScoresQueryOptions(userId?: string, email?: string) {
  return queryOptions({
    queryKey: ['myScores', userId],
    queryFn: () => fetchMyScores(email!),
    enabled: Boolean(userId && email?.trim()),
    staleTime: 120_000,
  });
}

export function publicProfileQueryOptions(userId?: string) {
  return queryOptions({
    queryKey: ['publicProfile', userId],
    queryFn: () => fetchPublicProfile(userId!),
    enabled: Boolean(userId),
    staleTime: 120_000,
  });
}
