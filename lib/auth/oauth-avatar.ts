import type { User } from '@supabase/supabase-js';

/** Google / Supabase OAuth often expose `picture` or `avatar_url` on metadata or identities. */
export function oauthProfilePictureUrl(user: User): string | undefined {
  const meta = user.user_metadata as Record<string, unknown> | undefined;
  for (const key of ['avatar_url', 'picture'] as const) {
    const v = meta?.[key];
    if (typeof v === 'string' && /^https?:\/\//i.test(v.trim())) return v.trim();
  }
  for (const id of user.identities ?? []) {
    const d = id.identity_data as Record<string, unknown> | undefined;
    if (!d) continue;
    for (const key of ['avatar_url', 'picture'] as const) {
      const v = d[key];
      if (typeof v === 'string' && /^https?:\/\//i.test(v.trim())) return v.trim();
    }
  }
  return undefined;
}
