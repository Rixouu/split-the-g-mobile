/** Locale-free path used in web emails / push payloads (matches `competitionDetailPath` on web). */
export function competitionDetailWebPath(c: { id: string; path_segment?: string | null }): string {
  const seg = c.path_segment?.trim();
  if (seg) return `/competitions/${encodeURIComponent(seg)}`;
  return `/competitions/${c.id}`;
}
