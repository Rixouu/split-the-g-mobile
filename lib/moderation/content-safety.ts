import AsyncStorage from '@react-native-async-storage/async-storage';

import type { PourScore } from '@/lib/api/types';

const BLOCKED_ACTORS_KEY = 'split-the-g:blocked-actors:v1';

// A deliberately small, high-confidence list. This prevents obvious abusive profile
// names without rejecting ordinary names that happen to contain a short substring.
const OBJECTIONABLE_TERMS = [
  'cunt',
  'fuck',
  'nigger',
  'nigga',
  'retard',
  'whore',
] as const;

function normalizedWords(value: string): string[] {
  return value
    .toLocaleLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .split(/\s+/)
    .filter(Boolean);
}

export function containsObjectionableText(value: string): boolean {
  const words = new Set(normalizedWords(value));
  return OBJECTIONABLE_TERMS.some((term) => words.has(term));
}

export function scoreActorKey(score: Pick<PourScore, 'submitter_user_id' | 'username'>): string | null {
  const userId = score.submitter_user_id?.trim();
  if (userId) return `user:${userId}`;

  const username = score.username?.trim().toLocaleLowerCase();
  return username ? `name:${username}` : null;
}

async function readBlockedActors(): Promise<Set<string>> {
  try {
    const raw = await AsyncStorage.getItem(BLOCKED_ACTORS_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return new Set(Array.isArray(parsed) ? parsed.filter((value): value is string => typeof value === 'string') : []);
  } catch {
    return new Set();
  }
}

export async function blockScoreActor(score: Pick<PourScore, 'submitter_user_id' | 'username'>): Promise<boolean> {
  const actorKey = scoreActorKey(score);
  if (!actorKey) return false;

  const blocked = await readBlockedActors();
  blocked.add(actorKey);
  await AsyncStorage.setItem(BLOCKED_ACTORS_KEY, JSON.stringify([...blocked]));
  return true;
}

export async function filterBlockedScores<T extends Pick<PourScore, 'submitter_user_id' | 'username'>>(
  scores: T[],
): Promise<T[]> {
  const blocked = await readBlockedActors();
  if (blocked.size === 0) return scores;
  return scores.filter((score) => {
    const actorKey = scoreActorKey(score);
    return !actorKey || !blocked.has(actorKey);
  });
}
