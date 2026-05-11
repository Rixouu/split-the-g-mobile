import type { User } from '@supabase/supabase-js';

import { supabase } from '@/lib/supabase/client';

export async function fetchLeaderboardDisplayNameForUser(user: User): Promise<string> {
  const { data: profile } = await supabase
    .from('public_profiles')
    .select('nickname')
    .eq('user_id', user.id)
    .maybeSingle();

  const nick = typeof profile?.nickname === 'string' ? profile.nickname.trim() : '';

  const rawMeta = (user.user_metadata ?? {}) as Record<string, unknown>;
  const googleFullName =
    (typeof rawMeta.full_name === 'string' && rawMeta.full_name.trim()) ||
    (typeof rawMeta.name === 'string' && rawMeta.name.trim()) ||
    (typeof rawMeta.given_name === 'string' && rawMeta.given_name.trim()) ||
    user.email?.split('@')[0] ||
    'Drinker';

  return nick || googleFullName;
}

function emailsMatchClaim(a: string | null | undefined, b: string | null | undefined): boolean {
  const x = a?.trim().toLowerCase() ?? '';
  const y = b?.trim().toLowerCase() ?? '';
  return Boolean(x && y && x === y);
}

export function canUnclaimPour(userEmail: string | null | undefined, scoreEmail: string | null | undefined): boolean {
  return emailsMatchClaim(userEmail, scoreEmail);
}
