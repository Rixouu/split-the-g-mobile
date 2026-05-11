import * as Crypto from 'expo-crypto';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const POUR_SESSION_KEY = 'split-g-session';
let webFallbackSessionId: string | null = null;

export async function getPourSessionId(): Promise<string> {
  if (Platform.OS === 'web') {
    webFallbackSessionId ||= Crypto.randomUUID();
    return webFallbackSessionId;
  }

  const existing = await SecureStore.getItemAsync(POUR_SESSION_KEY);
  if (existing) return existing;

  const sessionId = Crypto.randomUUID();
  await SecureStore.setItemAsync(POUR_SESSION_KEY, sessionId);
  return sessionId;
}
