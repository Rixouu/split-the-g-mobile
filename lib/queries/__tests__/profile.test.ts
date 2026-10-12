import { QueryClient } from '@tanstack/react-query';
import type { User } from '@supabase/supabase-js';

import { fetchProfileHubBundle } from '@/lib/api/profile-hub-data';
import { fetchFavoriteRows, fetchMyScores, fetchPublicProfile } from '@/lib/api/profile';
import { favoriteRowsQueryOptions, myScoresQueryOptions } from '../profile';

jest.mock('@/lib/api/profile', () => ({
  fetchFavoriteRows: jest.fn(), fetchMyScores: jest.fn(), fetchPublicProfile: jest.fn(),
}));
jest.mock('@/lib/api/pub-notebook', () => ({ fetchPubNotes: jest.fn() }));
jest.mock('@/lib/pub/guest-notebook', () => ({ readGuestNotebook: jest.fn() }));

const user = { id: 'account-a', email: 'someone@example.test' } as User;
let client: QueryClient;

beforeEach(() => {
  client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  (fetchFavoriteRows as jest.Mock).mockResolvedValue([{ id: 'place-a' }]);
  (fetchMyScores as jest.Mock).mockResolvedValue([{ id: 'score-a' }]);
  (fetchPublicProfile as jest.Mock).mockResolvedValue({ nickname: 'Someone' });
});
afterEach(() => client.clear());

it('reuses the preloaded Notebook and score data when Profile opens', async () => {
  await Promise.all([
    client.prefetchQuery(favoriteRowsQueryOptions(user.id)),
    client.prefetchQuery(myScoresQueryOptions(user.id, user.email)),
  ]);
  const hub = await fetchProfileHubBundle(user, client);
  expect(hub.favorites).toEqual([{ id: 'place-a' }]);
  expect(fetchFavoriteRows).toHaveBeenCalledTimes(1);
  expect(fetchMyScores).toHaveBeenCalledTimes(1);
  expect(fetchPublicProfile).toHaveBeenCalledTimes(1);
});

it('deduplicates requests when Notebook and Profile load at the same time', async () => {
  let resolve!: (value: { id: string }[]) => void;
  (fetchFavoriteRows as jest.Mock).mockReturnValue(new Promise((done) => { resolve = done; }));
  const notebook = client.fetchQuery(favoriteRowsQueryOptions(user.id));
  const profile = fetchProfileHubBundle(user, client);
  expect(fetchFavoriteRows).toHaveBeenCalledTimes(1);
  resolve([{ id: 'place-a' }]);
  await Promise.all([notebook, profile]);
  expect(fetchFavoriteRows).toHaveBeenCalledTimes(1);
});

it('refetches invalidated data and isolates accounts', async () => {
  await fetchProfileHubBundle(user, client);
  await client.invalidateQueries({ queryKey: ['favorites', user.id] });
  await fetchProfileHubBundle(user, client);
  expect(fetchFavoriteRows).toHaveBeenCalledTimes(2);
  await fetchProfileHubBundle({ ...user, id: 'account-b' }, client);
  expect(fetchFavoriteRows).toHaveBeenCalledTimes(3);
  expect(fetchFavoriteRows).toHaveBeenLastCalledWith('account-b');
});
