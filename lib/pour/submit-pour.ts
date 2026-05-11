import * as FileSystem from 'expo-file-system/legacy';

import { appConfig } from '@/lib/config';
import { getPourSessionId } from '@/lib/pour/session';

import type { PourSubmissionResponse } from '@/lib/api/types';

interface SubmitPourArgs {
  imageUri: string;
  accessToken?: string | null;
  actorName?: string | null;
  competitionId?: string | null;
}

function filenameFromUri(uri: string): string {
  return uri.split('/').pop() || `split-the-g-${Date.now()}.jpg`;
}

export async function submitPourImage({
  imageUri,
  accessToken,
  actorName,
  competitionId,
}: SubmitPourArgs): Promise<PourSubmissionResponse> {
  const base64Image = await FileSystem.readAsStringAsync(imageUri, {
    encoding: 'base64',
  });
  const info = await FileSystem.getInfoAsync(imageUri);
  const sessionId = await getPourSessionId();

  const formData = new FormData();
  formData.append('image', `data:image/jpeg;base64,${base64Image}`);
  formData.append('source', 'expo');
  formData.append('clientFileName', filenameFromUri(imageUri));
  formData.append('clientFileLastModifiedMs', String(info.exists ? info.modificationTime ?? Date.now() : Date.now()));
  formData.append('mobileSessionId', sessionId);

  if (accessToken) formData.append('accessToken', accessToken);
  if (actorName) formData.append('actorName', actorName);
  if (competitionId) formData.append('competition', competitionId);

  const response = await fetch(`${appConfig.apiBaseUrl}/api/pour-submission`, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'X-Split-G-Session': sessionId,
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
    },
    body: formData,
  });

  const payload = (await response.json().catch(() => null)) as PourSubmissionResponse | null;
  if (!payload) {
    return {
      success: false,
      error: 'INVALID_RESPONSE',
      status: response.status,
    };
  }

  return payload;
}
