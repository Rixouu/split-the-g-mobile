import type { FavoriteRow } from '@/lib/api/profile';

export const NOTEBOOK_TAGS = ['Food', 'Outdoor seating', 'Quiet', 'Live music', 'Alcohol-free options', 'Step-free access'] as const;
export type NotebookTag = (typeof NOTEBOOK_TAGS)[number];
export type VisitStatus = 'want_to_visit' | 'visited';
export const NOTE_MAX_LENGTH = 2000;

export interface PubNote {
  favorite_id: string;
  user_id: string;
  status: VisitStatus;
  notes: string;
  tags: NotebookTag[];
  updated_at: string;
}
export interface NotebookPlace extends FavoriteRow { note: PubNote | null }

export function notebookPlaces(favorites: FavoriteRow[], notes: PubNote[]): NotebookPlace[] {
  const byId = new Map(notes.map((note) => [note.favorite_id, note]));
  return favorites.map((favorite) => ({ ...favorite, note: byId.get(favorite.id) ?? null }));
}

export function filterNotebook(places: NotebookPlace[], query: string, status: VisitStatus | 'all', tag: NotebookTag | null): NotebookPlace[] {
  const words = query.trim().toLocaleLowerCase().split(/\s+/).filter(Boolean);
  return places.filter((place) => {
    if (status !== 'all' && (place.note?.status ?? 'want_to_visit') !== status) return false;
    if (tag && !place.note?.tags.includes(tag)) return false;
    const text = [place.bar_name, place.bar_address, place.note?.notes, ...(place.note?.tags ?? [])].join(' ').toLocaleLowerCase();
    return words.every((word) => text.includes(word));
  });
}

export function validateNote(input: { status: VisitStatus; notes: string; tags: NotebookTag[] }) {
  if (!['want_to_visit', 'visited'].includes(input.status)) throw new Error('Choose a visit status.');
  if (input.notes.length > NOTE_MAX_LENGTH) throw new Error(`Notes must be ${NOTE_MAX_LENGTH} characters or fewer.`);
  if (input.tags.some((tag) => !NOTEBOOK_TAGS.includes(tag))) throw new Error('Choose one of the available tags.');
  return { status: input.status, notes: input.notes.trim(), tags: [...new Set(input.tags)] };
}
