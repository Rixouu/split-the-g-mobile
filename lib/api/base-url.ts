/** API routes live outside the web site's language routes. Accept copied web URLs. */
export function normalizeApiBaseUrl(value: string): string {
  return value.trim().replace(/\/+$/, '').replace(/\/(?:en|th|fr|es|de|it|ja)$/i, '');
}
