import Constants, { ExecutionEnvironment } from 'expo-constants';
import * as Linking from 'expo-linking';
import { Platform } from 'react-native';

import { appConfig } from '@/lib/config';

/**
 * OAuth `redirectTo` passed to Supabase — must match **Authentication → URL Configuration → Redirect URLs** exactly.
 * If it does not, Supabase redirects to **Site URL** (e.g. https://split-the-g.app/) and the session opens in the browser instead of the app.
 *
 * - **Dev client / standalone / EAS builds:** stable `splittheg://auth/callback` (add once in Supabase).
 * - **Expo Go:** `Linking.createURL('auth/callback')` → `exp://…:8081/--/auth/callback` (host/IP varies; add each Metro log line to Supabase). Android emulator often uses `exp://10.0.2.2:8081/--/auth/callback`.
 * - **Override:** set `EXPO_PUBLIC_AUTH_REDIRECT_URL` to pin a single URL during experiments.
 */
export function getOAuthRedirectTo(): string {
  const manual = process.env.EXPO_PUBLIC_AUTH_REDIRECT_URL?.trim();
  if (manual) return manual;

  if (Platform.OS === 'web') {
    return Linking.createURL('auth/callback');
  }

  const env = Constants.executionEnvironment;
  if (env === ExecutionEnvironment.Standalone || env === ExecutionEnvironment.Bare) {
    return `${appConfig.appScheme}://auth/callback`;
  }

  return Linking.createURL('auth/callback');
}
