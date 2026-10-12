import type { QueryClient } from '@tanstack/react-query';

import type { FavoriteRow } from '@/lib/api/profile';
import type { PubNote } from '@/lib/pub/notebook';
import { favoriteRowsQueryOptions, pubNotesQueryOptions } from '@/lib/queries/profile';

/** Apply confirmed writes before revalidating, without a slow network round trip in the editor. */
export async function updateNotebookCache(queryClient: QueryClient, userId: string | undefined, change: {
  favorite?: FavoriteRow;
  note?: PubNote;
  removedId?: string;
}) {
  const favoritesKey = favoriteRowsQueryOptions(userId).queryKey;
  const notesKey = pubNotesQueryOptions(userId).queryKey;
  // An older in-flight response must not overwrite the confirmed write.
  await Promise.all([
    change.favorite || change.removedId ? queryClient.cancelQueries({ queryKey: favoritesKey, exact: true }) : undefined,
    change.note || change.removedId ? queryClient.cancelQueries({ queryKey: notesKey, exact: true }) : undefined,
  ]);
  if (change.favorite || change.removedId) {
    queryClient.setQueryData<FavoriteRow[]>(favoritesKey, (rows) => {
      if (!rows) return rows;
      if (change.removedId) return rows.filter((row) => row.id !== change.removedId);
      return [change.favorite!, ...rows.filter((row) => row.id !== change.favorite!.id)];
    });
  }
  if (change.note || change.removedId) {
    queryClient.setQueryData<PubNote[]>(notesKey, (rows) => {
      if (!rows) return rows;
      const remaining = rows.filter((row) => row.favorite_id !== (change.removedId ?? change.note!.favorite_id));
      return change.note ? [...remaining, change.note] : remaining;
    });
  }
}
