import AsyncStorage from '@react-native-async-storage/async-storage';
import { addGuestPlace, readGuestNotebook, removeGuestPlace, saveGuestNote } from '../guest-notebook';

jest.mock('@react-native-async-storage/async-storage', () => jest.requireActual('@react-native-async-storage/async-storage/jest/async-storage-mock'));
jest.mock('expo-crypto', () => ({ randomUUID: jest.fn().mockReturnValueOnce('one').mockReturnValueOnce('two').mockReturnValue('three') }));

beforeEach(async () => { await AsyncStorage.clear(); });

it('supports the entire notebook without an account or network', async () => {
  await addGuestPlace('Garden Pub', 'Bangkok');
  const id = (await readGuestNotebook()).favorites[0].id;
  await saveGuestNote(id, { status: 'visited', notes: 'Outdoor tables', tags: ['Outdoor seating'] });
  const reopened = await readGuestNotebook();
  expect(reopened.notes[0].notes).toBe('Outdoor tables');
  expect(reopened.notes[0].status).toBe('visited');
  await saveGuestNote(id, { status: 'want_to_visit', notes: '', tags: [] });
  expect((await readGuestNotebook()).notes).toHaveLength(1);
  await removeGuestPlace(id);
  expect(await readGuestNotebook()).toEqual({ favorites: [], notes: [] });
});

it('serializes writes and prevents duplicate places', async () => {
  await Promise.all([addGuestPlace('First', null), addGuestPlace('Second', null), addGuestPlace('first', null)]);
  expect((await readGuestNotebook()).favorites).toHaveLength(2);
});

it('rejects a note for a removed place', async () => {
  await expect(saveGuestNote('missing', { status: 'visited', notes: 'test', tags: [] })).rejects.toThrow('no longer');
});

it('does not overwrite corrupted local data', async () => {
  await AsyncStorage.setItem('split-the-g-guest-notebook-v1', 'not json');
  await expect(addGuestPlace('test', null)).rejects.toThrow();
  expect(await AsyncStorage.getItem('split-the-g-guest-notebook-v1')).toBe('not json');
});
