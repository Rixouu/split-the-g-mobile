const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/** True if `ref` is a score row UUID (used to choose id vs slug lookup). */
export function isScoreUuidRef(ref: string): boolean {
  return UUID_RE.test(ref.trim());
}

/** Canonical shareable path segment for Expo Router: `/pour/{slug}` or `/pour/{uuid}`. */
export function scorePourPathFromFields(row: { id: string; slug?: string | null }): string {
  const s = row.slug?.trim();
  if (s) return `/pour/${encodeURIComponent(s)}`;
  return `/pour/${encodeURIComponent(row.id)}`;
}
