/**
 * Canonical pub URL segment — keep in sync with web `app/utils/pubPath.ts`
 * and `match_bar_pub_path_segment` in the database.
 */
export function barKeyToPubPathSegment(barKey: string): string {
  const lower = barKey.trim().toLowerCase();
  const slug = lower
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  if (slug.length > 0) return slug;
  return encodeURIComponent(lower);
}
