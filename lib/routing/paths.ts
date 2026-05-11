export function mobilePathFromWebPath(path: string): string {
  const normalized = path.trim();
  const match = normalized.match(/^\/(?:en|th|fr|es|de|it|ja)(\/pour\/[^?]+)(?:\?.*)?$/);
  if (match?.[1]) return match[1];
  return normalized;
}
