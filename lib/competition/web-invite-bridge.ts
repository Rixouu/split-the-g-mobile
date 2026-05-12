import { appConfig } from '@/lib/config';
import { supabase } from '@/lib/supabase/client';

async function getBearerToken(): Promise<string | null> {
  const { data } = await supabase.auth.getSession();
  return data.session?.access_token ?? null;
}

export async function postCompetitionInvitePush(body: Record<string, unknown>): Promise<void> {
  const token = await getBearerToken();
  if (!token) return;
  await fetch(`${appConfig.apiBaseUrl}/api/push-notify`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  }).catch(() => null);
}

export async function postFriendInviteEmail(body: Record<string, unknown>): Promise<Response> {
  return fetch(`${appConfig.apiBaseUrl}/api/friend-invite`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}
