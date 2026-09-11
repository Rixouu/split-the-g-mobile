jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(async () => null),
  setItem: jest.fn(async () => undefined),
}));

import { containsObjectionableText, scoreActorKey } from '../content-safety';

describe('content safety', () => {
  it('rejects obvious abusive profile names without substring false positives', () => {
    expect(containsObjectionableText('The Fuck')).toBe(true);
    expect(containsObjectionableText('Scunthorpe Pints')).toBe(false);
  });

  it('prefers a stable user id for blocking and falls back to a normalized name', () => {
    expect(scoreActorKey({ submitter_user_id: 'abc', username: 'Pint Fan' })).toBe('user:abc');
    expect(scoreActorKey({ submitter_user_id: null, username: ' Pint Fan ' })).toBe('name:pint fan');
  });
});
