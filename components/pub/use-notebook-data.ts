import { useQuery } from '@tanstack/react-query';
import { favoriteRowsQueryOptions, pubNotesQueryOptions } from '@/lib/queries/profile';

export function useNotebookData(userId?: string, enabled = true) {
  const favorites = useQuery({
    ...favoriteRowsQueryOptions(userId),
    enabled,
  });
  const notes = useQuery({
    ...pubNotesQueryOptions(userId),
    enabled,
  });
  return { favorites, notes };
}
