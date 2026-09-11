import { appConfig } from '@/lib/config';

interface DeleteAccountResponse {
  success?: boolean;
  error?: string;
}

export async function deleteMyAccount(accessToken: string): Promise<void> {
  const response = await fetch(`${appConfig.apiBaseUrl}/api/account`, {
    method: 'DELETE',
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
  });

  const payload = (await response.json().catch(() => ({}))) as DeleteAccountResponse;
  if (!response.ok || !payload.success) {
    throw new Error(payload.error?.trim() || 'Could not delete your account. Please try again.');
  }
}
