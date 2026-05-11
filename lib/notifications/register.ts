import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';

import { supabase } from '@/lib/supabase/client';

export async function registerForPushNotifications(userId: string): Promise<string | null> {
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

  await supabase.from('push_subscriptions').upsert(
    {
      user_id: userId,
      endpoint: token.data,
      platform: Device.osName ?? 'expo',
    },
    { onConflict: 'endpoint' },
  );

  return token.data;
}
