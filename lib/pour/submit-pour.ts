import * as FileSystem from 'expo-file-system/legacy';
import * as ImageManipulator from 'expo-image-manipulator';

import { appConfig } from '@/lib/config';
import { getPourSessionId } from '@/lib/pour/session';

import type { PourSubmissionResponse } from '@/lib/api/types';

const MAX_SOURCE_IMAGE_BYTES = 18 * 1024 * 1024;
// Base64 adds about one third to the file size. Leave room below Vercel's 4.5 MB body limit.
const MAX_API_IMAGE_BYTES = 2_800_000;
const MAX_API_BASE64_CHARS = 3_800_000;

async function prepareImageForUpload(imageUri: string, size: number): Promise<{
  uri: string;
  mimeType: string;
  temporaryUris: string[];
} | null> {
  const mimeType = /\.png(?:\?|$)/i.test(imageUri) ? 'image/png' : 'image/jpeg';
  if (size <= MAX_API_IMAGE_BYTES && /\.(?:jpe?g|png)(?:\?|$)/i.test(imageUri)) {
    return { uri: imageUri, mimeType, temporaryUris: [] };
  }

  const temporaryUris: string[] = [];
  let sourceWidth: number | null = null;
  try {
    for (const [maxWidth, quality] of [[null, 0.78], [1600, 0.7], [1280, 0.6], [960, 0.5]] as const) {
      const width = maxWidth === null ? null : Math.min(sourceWidth ?? maxWidth, maxWidth);
      const result = await ImageManipulator.manipulateAsync(
        imageUri,
        width === null ? [] : [{ resize: { width } }],
        { compress: quality, format: ImageManipulator.SaveFormat.JPEG },
      );
      sourceWidth ??= result.width;
      temporaryUris.push(result.uri);
      const info = await FileSystem.getInfoAsync(result.uri);
      if (info.exists && info.size <= MAX_API_IMAGE_BYTES) {
        return { uri: result.uri, mimeType: 'image/jpeg', temporaryUris };
      }
    }
  } catch (error) {
    await Promise.all(temporaryUris.map((uri) => FileSystem.deleteAsync(uri, { idempotent: true }).catch(() => {})));
    throw error;
  }

  await Promise.all(temporaryUris.map((uri) => FileSystem.deleteAsync(uri, { idempotent: true }).catch(() => {})));
  return null;
}

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
  const info = await FileSystem.getInfoAsync(imageUri);
  if (!info.exists) {
    return { success: false, error: 'INVALID_IMAGE' };
  }
  if (info.size > MAX_SOURCE_IMAGE_BYTES) {
    return { success: false, error: 'IMAGE_TOO_LARGE' };
  }

  const prepared = await prepareImageForUpload(imageUri, info.size);
  if (!prepared) return { success: false, error: 'IMAGE_TOO_LARGE' };

  try {
    const base64Image = await FileSystem.readAsStringAsync(prepared.uri, {
      encoding: 'base64',
    });
    if (base64Image.length > MAX_API_BASE64_CHARS) {
      return { success: false, error: 'IMAGE_TOO_LARGE' };
    }
    const sessionId = await getPourSessionId();

    const formData = new FormData();
    formData.append('image', `data:${prepared.mimeType};base64,${base64Image}`);
    formData.append('source', 'expo');
    formData.append('clientFileName', filenameFromUri(prepared.uri));
    // Expo FileSystem reports seconds; the web API expects milliseconds like File.lastModified.
    formData.append('clientFileLastModifiedMs', String(info.modificationTime * 1000));
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

    if (response.status === 413) {
      return { success: false, error: 'IMAGE_TOO_LARGE', status: 413 };
    }
    const payload: unknown = await response.json().catch(() => null);
    if (!payload || typeof payload !== 'object' || typeof (payload as { success?: unknown }).success !== 'boolean') {
      return {
        success: false,
        error: 'INVALID_RESPONSE',
        detail: `The analysis service returned an invalid response (HTTP ${response.status}).`,
        status: response.status,
      };
    }

    return payload as PourSubmissionResponse;
  } finally {
    await Promise.all(prepared.temporaryUris.map((uri) =>
      FileSystem.deleteAsync(uri, { idempotent: true }).catch(() => {}),
    ));
  }
}
