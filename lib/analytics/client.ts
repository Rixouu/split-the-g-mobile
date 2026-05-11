import { PostHog } from 'posthog-react-native';

import { appConfig } from '@/lib/config';

let posthog: PostHog | null = null;

export function getPosthogClient(): PostHog | null {
  if (!appConfig.posthogKey) return null;
  if (!posthog) {
    posthog = new PostHog(appConfig.posthogKey, {
      host: appConfig.posthogHost,
    });
  }
  return posthog;
}

export function trackEvent(
  eventName: string,
  properties?: Record<string, string | number | boolean | null | undefined>,
) {
  const sanitizedProperties = Object.fromEntries(
    Object.entries(properties ?? {}).filter(([, value]) => value !== undefined),
  ) as Record<string, string | number | boolean | null>;

  getPosthogClient()?.capture(eventName, sanitizedProperties);
}
