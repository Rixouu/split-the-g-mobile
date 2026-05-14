import Constants, { ExecutionEnvironment } from 'expo-constants';
import * as Device from 'expo-device';
import * as Linking from 'expo-linking';
import { Platform } from 'react-native';

import { appConfig } from '@/lib/config';

/**
 * OAuth `redirectTo` passed to Supabase — must match **Authentication → URL Configuration → Redirect URLs** exactly.
 * If it does not, Supabase redirects to **Site URL** (e.g. https://www.split-the-g.app/) and the session opens in the browser instead of the app.
 *
 * - **Dev client / standalone / EAS builds:** stable `splittheg://auth/callback` (add once in Supabase).
 * - **Expo Go:** `Linking.createURL('auth/callback')` → `exp://…:8081/--/auth/callback`. **Important:** Supabase GoTrue rejects redirect URLs whose hostname is a **non-loopback IP** before the allowlist is checked, so `exp://192.168.x.x/...` and `exp://10.0.2.2/...` do **not** work even if you add them in the dashboard. On **simulators** this app rewrites those to `127.0.0.1` (loopback, accepted by GoTrue). On a **physical device** use **`npx expo start --tunnel`** (then add the logged `exp://…` host to Supabase) or a **development build** with `splittheg://auth/callback`.
 * - **Override:** set `EXPO_PUBLIC_AUTH_REDIRECT_URL` to pin a single URL during experiments.
 */

function parseIpv4Octets(hostname: string): [number, number, number, number] | null {
  const parts = hostname.split('.');
  if (parts.length !== 4) return null;
  const octets = parts.map((p) => Number(p));
  if (octets.some((n) => !Number.isInteger(n) || n < 0 || n > 255)) return null;
  return octets as [number, number, number, number];
}

/**
 * Supabase GoTrue (`IsRedirectURLValid`) only allows non-HTTP(S) redirects whose host is **not** a literal IPv4 address,
 * **unless** that address is loopback (127.0.0.0/8). Private LAN IPs are rejected **before** the URL allowlist runs.
 * @see https://github.com/supabase/auth/issues/2039
 */
export function oauthRedirectLikelyRejectedByGoTrue(redirectTo: string): boolean {
  try {
    const { hostname } = new URL(redirectTo);
    const octets = parseIpv4Octets(hostname);
    if (!octets) return false;
    return octets[0] !== 127;
  } catch {
    return false;
  }
}

function rewriteUrlHostname(redirectTo: string, hostname: string): string {
  const u = new URL(redirectTo);
  u.hostname = hostname;
  return u.toString();
}

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

  let redirectTo = Linking.createURL('auth/callback');

  // Expo Go + LAN/emulator IP in exp:// — Supabase rejects non-loopback IPs before allowlist (see oauthRedirectLikelyRejectedByGoTrue).
  // Simulators reach Metro on 127.0.0.1; physical devices need tunnel or a dev build instead.
  if (redirectTo.startsWith('exp://') && oauthRedirectLikelyRejectedByGoTrue(redirectTo) && !Device.isDevice) {
    redirectTo = rewriteUrlHostname(redirectTo, '127.0.0.1');
  }

  return redirectTo;
}
