export function mobilePathFromWebPath(path: string): string {
  const normalized = path.trim();
  const match = normalized.match(/^\/(?:en|th|fr|es|de|it|ja)(\/pour\/[^?]+)(?:\?.*)?$/);
  if (match?.[1]) return match[1];
  return normalized;
}

/** Strip query and hash for validation; navigation uses this pathname only. */
function stripQueryAndHash(path: string): string {
  let s = path.trim();
  const q = s.indexOf('?');
  if (q !== -1) s = s.slice(0, q);
  const h = s.indexOf('#');
  if (h !== -1) s = s.slice(0, h);
  return s;
}

const NOTIFICATION_EXACT_PATHS = new Set([
  '/',
  '/feed',
  '/compete',
  '/pubs',
  '/profile',
  '/wall',
  '/faq',
  '/language',
  '/leaderboard',
  '/leaderboard/country-stats',
]);

const NOTIFICATION_PREFIX_PATHS = ['/pour/', '/competition/', '/pub/', '/score/'];

function isUnderProfileSubroute(basePath: string): boolean {
  return basePath.startsWith('/profile/') && basePath.length > '/profile/'.length;
}

function matchesAllowedPrefix(basePath: string): boolean {
  for (const prefix of NOTIFICATION_PREFIX_PATHS) {
    if (!basePath.startsWith(prefix)) continue;
    if (basePath.length <= prefix.length) continue;
    return true;
  }
  return false;
}

/**
 * Returns a safe in-app pathname for Expo Router after push notification open, or null to ignore.
 * Rejects schemes, traversal, ambiguous hosts, and unknown routes.
 */
export function safeNotificationNavigatePath(raw: string): string | null {
  const converted = mobilePathFromWebPath(raw);
  const trimmed = converted.trim();

  if (trimmed.length === 0) return null;
  if (/^[\w+-]+:/.test(trimmed)) return null;
  if (!trimmed.startsWith('/')) return null;
  if (trimmed.startsWith('//')) return null;
  if (trimmed.includes('..')) return null;

  const base = stripQueryAndHash(trimmed);
  if (base.length === 0) return null;

  if (NOTIFICATION_EXACT_PATHS.has(base)) return base;
  if (matchesAllowedPrefix(base)) return base;
  if (isUnderProfileSubroute(base)) return base;

  return null;
}
