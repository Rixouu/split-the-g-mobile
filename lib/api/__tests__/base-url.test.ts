import { normalizeApiBaseUrl } from '../base-url';

it.each(['en', 'th', 'fr', 'es', 'de', 'it', 'ja'])('keeps API requests outside the %s website language route', (locale) => {
  expect(`${normalizeApiBaseUrl(` https://www.split-the-g.app/${locale}/ `)}/api/pour-submission`)
    .toBe('https://www.split-the-g.app/api/pour-submission');
});

it('preserves an explicitly configured API prefix', () => {
  expect(normalizeApiBaseUrl('https://example.test/backend/')).toBe('https://example.test/backend');
});

it('normalizes a root URL and repeated trailing slashes', () => {
  expect(normalizeApiBaseUrl('https://www.split-the-g.app///')).toBe('https://www.split-the-g.app');
});
