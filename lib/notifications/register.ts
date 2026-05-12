import Constants from 'expo-constants';

import type { SupportedLocale } from '@/lib/i18n/translations';
import { supabase } from '@/lib/supabase/client';

/**
 * Requests permission, registers an Expo push token, and stores it in
 * `push_subscriptions` for the same pipeline as the web app (server-side sends).
 *
 * Uses dynamic imports so `expo-notifications` is not loaded until this runs.
 */
export async function registerForPushNotifications(
  userId: string,
  userEmail: string | null | undefined,
  locale: SupportedLocale = 'en',
): Promise<string | null> {
  const Device = await import('expo-device');
  const Notifications = await import('expo-notifications');

  if (!Device.isDevice) return null;

  const existing = await Notifications.getPermissionsAsync();
  let status = existing.status;
  if (status !== 'granted') {
    const requested = await Notifications.requestPermissionsAsync();
    status = requested.status;
  }
  if (status !== 'granted') return null;

  const projectId =
    Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId ?? undefined;
  const token = await Notifications.getExpoPushTokenAsync(projectId ? { projectId } : undefined);

  const emailNorm = userEmail?.trim().toLowerCase() ?? null;

  await supabase.from('push_subscriptions').upsert(
    {
      user_id: userId,
      user_email: emailNorm,
      endpoint: token.data,
      p256dh: null,
      auth: null,
      platform: Device.osName ?? 'expo',
      locale,
      is_active: true,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'endpoint' },
  );

  const { ensureExpoNotificationListenersRegistered } = await import('@/lib/notifications/expo-listeners');
  await ensureExpoNotificationListenersRegistered({ allowExpoGo: true });

  return token.data;
}
