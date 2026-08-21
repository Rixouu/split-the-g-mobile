import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Crypto from 'expo-crypto';
import * as FileSystem from 'expo-file-system/legacy';

const QUEUE_STORAGE_KEY = 'split-the-g-offline-pour-queue-v1';
const QUEUE_DIRECTORY = `${FileSystem.documentDirectory ?? ''}split-the-g-pending-pours/`;

export interface OfflineQueuedPour {
  id: string;
  /** A durable local copy. Image-picker cache files are not guaranteed to survive an app restart. */
  imageUri: string;
  competitionId: string | null;
  actorName: string | null;
  queuedAt: number;
}

export interface QueuePourInput {
  imageUri: string;
  competitionId?: string | null;
  actorName?: string | null;
}

function isQueuedPour(value: unknown): value is OfflineQueuedPour {
  if (!value || typeof value !== 'object') return false;
  const row = value as Partial<OfflineQueuedPour>;
  return (
    typeof row.id === 'string' &&
    typeof row.imageUri === 'string' &&
    typeof row.queuedAt === 'number'
  );
}

async function readQueue(): Promise<OfflineQueuedPour[]> {
  const raw = await AsyncStorage.getItem(QUEUE_STORAGE_KEY);
  if (!raw) return [];

  try {
    const decoded: unknown = JSON.parse(raw);
    if (!Array.isArray(decoded)) return [];
    return decoded.filter(isQueuedPour).sort((a, b) => a.queuedAt - b.queuedAt);
  } catch {
    return [];
  }
}

async function writeQueue(items: OfflineQueuedPour[]): Promise<void> {
  await AsyncStorage.setItem(QUEUE_STORAGE_KEY, JSON.stringify(items));
}

async function removeLocalImage(uri: string): Promise<void> {
  try {
    const info = await FileSystem.getInfoAsync(uri);
    if (info.exists) await FileSystem.deleteAsync(uri, { idempotent: true });
  } catch {
    // A successful network submission must not be treated as failed because cleanup was unavailable.
  }
}

/** Save a durable photo copy before acknowledging an offline submission to the user. */
export async function enqueueOfflinePour(input: QueuePourInput): Promise<OfflineQueuedPour> {
  if (!FileSystem.documentDirectory) {
    throw new Error('Offline storage is unavailable on this device.');
  }

  const id = Crypto.randomUUID();
  await FileSystem.makeDirectoryAsync(QUEUE_DIRECTORY, { intermediates: true });
  const imageUri = `${QUEUE_DIRECTORY}${id}.jpg`;
  await FileSystem.copyAsync({ from: input.imageUri, to: imageUri });

  const item: OfflineQueuedPour = {
    id,
    imageUri,
    competitionId: input.competitionId?.trim() || null,
    actorName: input.actorName?.trim() || null,
    queuedAt: Date.now(),
  };

  try {
    const queue = await readQueue();
    queue.push(item);
    await writeQueue(queue);
    return item;
  } catch (error) {
    await removeLocalImage(imageUri);
    throw error;
  }
}

export async function pendingOfflinePours(): Promise<OfflineQueuedPour[]> {
  return readQueue();
}

export async function removeOfflinePour(item: OfflineQueuedPour): Promise<void> {
  const queue = await readQueue();
  await writeQueue(queue.filter((row) => row.id !== item.id));
  await removeLocalImage(item.imageUri);
}

/**
 * Replay queued submissions in order. A failed item is deliberately retained so a transient
 * connection failure never discards a user's photo.
 */
export async function flushOfflinePourQueue(
  submit: (item: OfflineQueuedPour) => Promise<void>,
): Promise<{ synced: number; pending: number }> {
  const queue = await readQueue();
  let synced = 0;

  for (const item of queue) {
    try {
      await submit(item);
      await removeOfflinePour(item);
      synced += 1;
    } catch {
      break;
    }
  }

  const remaining = await readQueue();
  return { synced, pending: remaining.length };
}

/** React Native reports this text for unreachable hosts across iOS and Android. */
export function isLikelyNetworkError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error ?? '');
  return /network request failed|failed to fetch|network error|offline|timed out|timeout/i.test(message);
}
