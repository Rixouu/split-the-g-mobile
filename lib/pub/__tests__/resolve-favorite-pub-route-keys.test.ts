import { resolveFavoritePubRouteKeys } from '../resolve-favorite-pub-route-keys';
import type { FavoriteRow } from '@/lib/api/profile';

type Request = { table: string; columns?: string; candidates?: string[]; pattern?: string };
const mockRequests: Request[] = [];
let mockResponse: (request: Request) => unknown;
jest.mock('@/lib/supabase/client', () => ({
  supabase: {
    from: (table: string) => {
      const request: Request = { table };
      mockRequests.push(request);
      const builder = {
        select: (columns: string) => { request.columns = columns; return builder; },
        order: () => builder,
        limit: () => builder,
        in: (_column: string, candidates: string[]) => { request.candidates = candidates; return builder; },
        ilike: (_column: string, pattern: string) => { request.pattern = pattern; return builder; },
        maybeSingle: () => builder,
        then: (resolve: (value: unknown) => void, reject: (error: unknown) => void) => Promise.resolve(mockResponse(request)).then(resolve, reject),
      };
      return builder;
    },
  },
}));

function place(id: string, name: string): FavoriteRow {
  return { id, bar_name: name, bar_address: null, created_at: '2026-10-12' };
}
beforeEach(() => {
  mockRequests.length = 0;
  mockResponse = () => ({ data: [], error: null });
});

it('returns canonical saved venue keys without scanning the entire directory', async () => {
  mockResponse = () => ({ data: [{ bar_key: 'garden-pub' }], error: null });
  expect(await resolveFavoritePubRouteKeys([place('one', 'garden-pub')])).toEqual({ one: 'garden-pub' });
  expect(mockRequests).toHaveLength(1);
  expect(mockRequests[0].candidates).toContain('garden-pub');
});

it('resolves a display title through the directory and skips duplicate lookups', async () => {
  mockResponse = (request) => ({
    data: request.columns?.includes('display_name') ? [{ bar_key: 'canonical-key', display_name: 'Garden Pub' }] : [], error: null,
  });
  expect(await resolveFavoritePubRouteKeys([place('one', 'Garden Pub'), place('two', 'garden pub')])).toEqual({ one: 'canonical-key', two: 'canonical-key' });
  expect(mockRequests).toHaveLength(2);
});

it('resolves independent fallback names concurrently and escapes wildcard characters', async () => {
  const pending = new Map<string, (value: unknown) => void>();
  mockResponse = (request) => request.pattern
    ? new Promise((resolve) => { pending.set(request.pattern!, resolve); })
    : { data: [], error: null };
  const result = resolveFavoritePubRouteKeys([place('one', 'First_Pub'), place('two', 'Second%Pub'), place('three', 'First_Pub')]);
  // Drain the async query continuations; both exact-name requests should start before either returns.
  for (let i = 0; i < 12; i++) await Promise.resolve();
  expect([...pending.keys()]).toEqual(['First\\_Pub', 'Second\\%Pub']);
  pending.get('First\\_Pub')!({ data: { bar_key: 'first-key' }, error: null });
  pending.get('Second\\%Pub')!({ data: { bar_key: 'second-key' }, error: null });
  expect(await result).toEqual({ one: 'first-key', two: 'second-key', three: 'first-key' });
});

it('does not query the database for an empty notebook', async () => {
  expect(await resolveFavoritePubRouteKeys([])).toEqual({});
  expect(mockRequests).toHaveLength(0);
});
