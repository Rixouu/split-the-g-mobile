import { isScoreUuidRef, scorePourPathFromFields } from '../score-path';

describe('isScoreUuidRef', () => {
  it('accepts lowercase UUID v4-shaped strings', () => {
    expect(isScoreUuidRef('550e8400-e29b-41d4-a716-446655440000')).toBe(true);
  });

  it('accepts uppercase UUIDs', () => {
    expect(isScoreUuidRef('550E8400-E29B-41D4-A716-446655440000')).toBe(true);
  });

  it('trims whitespace', () => {
    expect(isScoreUuidRef('  550e8400-e29b-41d4-a716-446655440000  ')).toBe(true);
  });

  it('rejects slugs and invalid strings', () => {
    expect(isScoreUuidRef('my-pour-slug')).toBe(false);
    expect(isScoreUuidRef('not-a-uuid')).toBe(false);
    expect(isScoreUuidRef('550e8400-e29b-41d4-a716')).toBe(false);
  });
});

describe('scorePourPathFromFields', () => {
  it('prefers slug when present', () => {
    expect(
      scorePourPathFromFields({
        id: '550e8400-e29b-41d4-a716-446655440000',
        slug: 'clean-pour',
      }),
    ).toBe('/pour/clean-pour');
  });

  it('encodes slug segments', () => {
    expect(scorePourPathFromFields({ id: 'x', slug: 'a b' })).toBe('/pour/a%20b');
  });

  it('falls back to id when slug empty', () => {
    expect(scorePourPathFromFields({ id: '550e8400-e29b-41d4-a716-446655440000', slug: null })).toBe(
      '/pour/550e8400-e29b-41d4-a716-446655440000',
    );
  });
});
