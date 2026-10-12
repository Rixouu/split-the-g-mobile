import { QueryClient } from '@tanstack/react-query';
import type { FavoriteRow } from '@/lib/api/profile';
import type { PubNote } from '../notebook';
import { updateNotebookCache } from '../notebook-cache';

jest.mock('@/lib/api/profile', () => ({}));
jest.mock('@/lib/api/pub-notebook', () => ({}));
jest.mock('@/lib/pub/guest-notebook', () => ({}));

const place: FavoriteRow = { id: 'place-a', bar_name: 'Garden Pub', bar_address: null, created_at: '2026-10-12' };
const note: PubNote = { favorite_id: place.id, user_id: 'account-a', status: 'visited', notes: 'Quiet garden', tags: [], updated_at: '2026-10-12' };
let client: QueryClient;
beforeEach(() => {
  client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  client.setQueryData(['favorites', 'account-a'], [place]);
  client.setQueryData(['pub-notes', 'account-a'], []);
  client.setQueryData(['favorites', 'account-b'], [place]);
});
afterEach(() => client.clear());

it('shows a confirmed saved note immediately without another read', async () => {
  await updateNotebookCache(client, 'account-a', { note });
  expect(client.getQueryData(['pub-notes', 'account-a'])).toEqual([note]);
  await updateNotebookCache(client, 'account-a', { note: { ...note, notes: 'Updated note' } });
  expect(client.getQueryData(['pub-notes', 'account-a'])).toEqual([{ ...note, notes: 'Updated note' }]);
});

it('removes a place and its note only from the current account', async () => {
  client.setQueryData(['pub-notes', 'account-a'], [note]);
  await updateNotebookCache(client, 'account-a', { removedId: place.id });
  expect(client.getQueryData(['favorites', 'account-a'])).toEqual([]);
  expect(client.getQueryData(['pub-notes', 'account-a'])).toEqual([]);
  expect(client.getQueryData(['favorites', 'account-b'])).toEqual([place]);
});

it('does not replace an unknown full list with one saved row', async () => {
  await updateNotebookCache(client, 'uncached-account', { favorite: place, note });
  expect(client.getQueryData(['favorites', 'uncached-account'])).toBeUndefined();
  expect(client.getQueryData(['pub-notes', 'uncached-account'])).toBeUndefined();
});

it('prevents an older request from overwriting a saved note', async () => {
  let resolve!: (value: PubNote[]) => void;
  const previous = client.fetchQuery({
    queryKey: ['pub-notes', 'account-a'],
    queryFn: () => new Promise<PubNote[]>((done) => { resolve = done; }),
  }).catch(() => {});
  await updateNotebookCache(client, 'account-a', { note });
  resolve([]);
  await previous;
  expect(client.getQueryData(['pub-notes', 'account-a'])).toEqual([note]);
});

it('adding a place does not cancel a private note that is still loading', async () => {
  let resolve!: (value: PubNote[]) => void;
  const loadingNotes = client.fetchQuery({
    queryKey: ['pub-notes', 'account-a'],
    queryFn: () => new Promise<PubNote[]>((done) => { resolve = done; }),
  });
  await updateNotebookCache(client, 'account-a', { favorite: place });
  resolve([note]);
  await expect(loadingNotes).resolves.toEqual([note]);
});
