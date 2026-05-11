/** PostgREST `ilike` treats `%` and `_` as wildcards; escape for literal email match. */
export function escapeIlikePattern(value: string): string {
  return value.replace(/\\/g, '\\\\').replace(/%/g, '\\%').replace(/_/g, '\\_');
}

export function normalizeEmail(e: string): string {
  return e.trim().toLowerCase();
}
