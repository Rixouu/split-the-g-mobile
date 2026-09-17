import { useQuery } from '@tanstack/react-query';
import { fetchFavoriteRows } from '@/lib/api/profile';
import { fetchPubNotes } from '@/lib/api/pub-notebook';
import { readGuestNotebook } from '@/lib/pub/guest-notebook';

export function useNotebookData(userId?: string) {
  const favorites = useQuery({
    queryKey: ['favorites', userId ?? 'guest'],
    queryFn: () => userId ? fetchFavoriteRows(userId) : readGuestNotebook().then((data) => data.favorites),
    networkMode: userId ? 'online' : 'always',
  });
  const notes = useQuery({
    queryKey: ['pub-notes', userId ?? 'guest'],
    queryFn: () => userId ? fetchPubNotes(userId) : readGuestNotebook().then((data) => data.notes),
    networkMode: userId ? 'online' : 'always',
  });
  return { favorites, notes };
}
