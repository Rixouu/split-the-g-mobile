import { mobilePathFromWebPath } from '@/lib/routing/paths';

let removeListeners: (() => void) | undefined;
let listenersSetup: Promise<void> | null = null;

async function registerExpoNotificationListenersInner(): Promise<() => void> {
  const Notifications = await import('expo-notifications');
  const { router } = await import('expo-router');

  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });

  const sub = Notifications.addNotificationResponseReceivedListener((response) => {
    const raw = response.notification.request.content.data?.path;
    if (typeof raw !== 'string' || !raw.trim()) return;
    const path = mobilePathFromWebPath(raw);
    router.push(path as never);
  });

  return () => sub.remove();
}

/**
 * Registers notification handler + response listener once.
 * Skips in Expo Go by default so we do not load `expo-notifications` at cold start
 * (remote push is not supported there on current SDKs). Call with `{ allowExpoGo: true }`
 * only after the user explicitly enables notifications.
 */
export async function ensureExpoNotificationListenersRegistered(options?: {
  allowExpoGo?: boolean;
}): Promise<void> {
  if (removeListeners) return;

  const Constants = await import('expo-constants');
  if (!options?.allowExpoGo && Constants.default.appOwnership === 'expo') return;

  if (!listenersSetup) {
    listenersSetup = registerExpoNotificationListenersInner().then((remove) => {
      removeListeners = remove;
    });
  }
  await listenersSetup;
}
