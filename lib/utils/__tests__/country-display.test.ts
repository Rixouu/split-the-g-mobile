import { flagEmojiFromIso2 } from '../country-display';

describe('flagEmojiFromIso2', () => {
  it('returns regional-indicator pair for valid ISO2', () => {
    expect(flagEmojiFromIso2('th')).toBe('🇹🇭');
    expect(flagEmojiFromIso2('GB')).toBe('🇬🇧');
  });

  it('returns empty string for invalid input', () => {
    expect(flagEmojiFromIso2(null)).toBe('');
    expect(flagEmojiFromIso2(undefined)).toBe('');
    expect(flagEmojiFromIso2('')).toBe('');
    expect(flagEmojiFromIso2('T')).toBe('');
    expect(flagEmojiFromIso2('THA')).toBe('');
    expect(flagEmojiFromIso2('12')).toBe('');
    expect(flagEmojiFromIso2('A1')).toBe('');
  });

  it('accepts any two-letter Latin pair after trim (not a full ISO validation)', () => {
    expect(flagEmojiFromIso2('aB')).toBe('🇦🇧');
  });

  it('trims whitespace', () => {
    expect(flagEmojiFromIso2('  US  ')).toBe('🇺🇸');
  });
});
