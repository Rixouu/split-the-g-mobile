import { AccessibilityInfo } from 'react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import { PubNotebookScreen } from '../pub-notebook-screen';
import { NotebookPlaceCard } from '../notebook-place-card';
import { NotebookSkeleton } from '@/components/split-the-g/loading-skeleton';
import { useNotebookData } from '../use-notebook-data';
import type { FavoriteRow } from '@/lib/api/profile';
import type { PubNote } from '@/lib/pub/notebook';

// Expo's Jest preset includes this renderer without a TypeScript declaration package.
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { act, create } = require('react-test-renderer');
const mockAuth = { user: { id: 'account-a' }, isLoading: false };
type QueryFixture<T> = {
  data: T[] | undefined;
  isLoading: boolean;
  isPending: boolean;
  isError: boolean;
  isRefetching: boolean;
  refetch: jest.Mock;
};
let mockNotebookData: { favorites: QueryFixture<FavoriteRow>; notes: QueryFixture<PubNote> };

jest.mock('@/lib/auth/auth-context', () => ({ useAuth: () => mockAuth }));
jest.mock('@/lib/i18n/locale-context', () => ({ useLocale: () => ({ t: () => 'Loading…' }) }));
jest.mock('../use-notebook-data', () => ({ useNotebookData: jest.fn(() => mockNotebookData) }));
jest.mock('@/lib/pub/resolve-favorite-pub-route-keys', () => ({ resolveFavoritePubRouteKeys: jest.fn().mockResolvedValue({}) }));
jest.mock('@/lib/api/profile', () => ({}));
jest.mock('@/lib/api/pub-notebook', () => ({}));
jest.mock('@/lib/pub/guest-notebook', () => ({}));
jest.mock('expo-router', () => ({ useRouter: () => ({ push: jest.fn() }) }));
jest.mock('react-native-safe-area-context', () => jest.requireActual('react-native-safe-area-context/jest/mock').default);

const place = { id: 'place-a', bar_name: 'Garden Pub', bar_address: 'Bangkok', created_at: '2026-10-12' };
const note: PubNote = { favorite_id: place.id, user_id: 'account-a', status: 'visited', notes: 'Quiet garden', tags: [], updated_at: '2026-10-12' };
const base = { isLoading: false, isPending: false, isError: false, isRefetching: false, refetch: jest.fn() };
let client: QueryClient;
let tree: ReturnType<typeof create>;

beforeEach(() => {
  mockAuth.isLoading = false;
  mockNotebookData = { favorites: { ...base, data: [place] }, notes: { ...base, data: [note] } };
  client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  jest.spyOn(AccessibilityInfo, 'isReduceMotionEnabled').mockResolvedValue(true);
});
afterEach(async () => {
  if (tree) await act(async () => tree.unmount());
  client.clear();
  jest.restoreAllMocks();
});

async function renderNotebook() {
  await act(async () => {
    tree = create(<QueryClientProvider client={client}><PubNotebookScreen /></QueryClientProvider>);
  });
}

it('shows a skeleton on the first load instead of a false empty notebook', async () => {
  mockNotebookData.favorites = { ...base, data: undefined, isPending: true, isLoading: true };
  await renderNotebook();
  expect(tree.root.findAllByType(NotebookSkeleton)).toHaveLength(1);
  expect(tree.root.findAllByType(NotebookPlaceCard)).toHaveLength(0);
});

it('shows places before slow private notes load, without allowing an overwrite', async () => {
  mockNotebookData.notes = { ...base, data: undefined, isPending: true, isLoading: true };
  await renderNotebook();
  expect(tree.root.findAllByType(NotebookSkeleton)).toHaveLength(0);
  expect(tree.root.findAllByType(NotebookPlaceCard)).toHaveLength(1);
  const editButton = tree.root.findByProps({ accessibilityLabel: 'Loading note…' });
  expect(editButton.props.disabled).toBe(true);
});

it('keeps places usable when private notes fail to load', async () => {
  mockNotebookData.notes = { ...base, data: undefined, isError: true };
  await renderNotebook();
  const card = tree.root.findByType(NotebookPlaceCard);
  expect(card.props.notesUnavailable).toBe(true);
  const editButton = tree.root.findByProps({ accessibilityLabel: 'Note unavailable' });
  expect(editButton.props.disabled).toBe(true);
});

it('keeps cached places and notes visible after a refresh fails', async () => {
  mockNotebookData.favorites = { ...mockNotebookData.favorites, isError: true };
  mockNotebookData.notes = { ...mockNotebookData.notes, isError: true };
  await renderNotebook();
  expect(tree.root.findAllByType(NotebookSkeleton)).toHaveLength(0);
  const card = tree.root.findByType(NotebookPlaceCard);
  expect(card.props.place.note.notes).toBe('Quiet garden');
  expect(card.props.notesUnavailable).toBe(false);
});

it('waits for auth before reading a guest notebook', async () => {
  mockAuth.isLoading = true;
  await renderNotebook();
  expect(useNotebookData).toHaveBeenCalledWith('account-a', false);
  expect(tree.root.findAllByType(NotebookSkeleton)).toHaveLength(1);
});
