import fs from 'node:fs';
import path from 'node:path';

import type { ConfigContext, ExpoConfig } from 'expo/config';

/**
 * Native MapView on Android reads the key from AndroidManifest (via prebuild),
 * not from JS. EXPO_PUBLIC_* alone does not inject it — wire it here + rebuild.
 * @see https://docs.expo.dev/versions/latest/sdk/map-view/#deploy-app-with-google-maps
 *
 * Android FCM: `google-services.json` must NOT live in git (GitHub secret scanning).
 * - Local / CI: place `google-services.json` at the repo root (gitignored).
 * - EAS Build: create a **File** env var `GOOGLE_SERVICES_JSON` per environment;
 *   the runner exposes it as a filesystem path in `process.env.GOOGLE_SERVICES_JSON`.
 * Also upload the Service Account JSON for FCM V1 in EAS credentials.
 * @see https://docs.expo.dev/push-notifications/fcm-credentials/
 * @see https://docs.expo.dev/eas/environment-variables/
 */
function resolveGoogleServicesFile(): string | undefined {
  const envPath = process.env.GOOGLE_SERVICES_JSON?.trim();
  if (envPath && fs.existsSync(envPath)) return envPath;

  const localPath = path.join(__dirname, 'google-services.json');
  if (fs.existsSync(localPath)) return './google-services.json';

  return undefined;
}

export default ({ config }: ConfigContext): ExpoConfig => {
  const name = config.name;
  const slug = config.slug;
  if (typeof name !== 'string' || typeof slug !== 'string') {
    throw new Error('Expo static config must define expo.name and expo.slug (see app.json).');
  }

  const googleMapsApiKey = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY?.trim() ?? '';
  const googleServicesFile = resolveGoogleServicesFile();

  return {
    ...config,
    name,
    slug,
    android: {
      ...config.android,
      ...(googleServicesFile ? { googleServicesFile } : {}),
      config: {
        ...config.android?.config,
        ...(googleMapsApiKey ? { googleMaps: { apiKey: googleMapsApiKey } } : {}),
      },
    },
    ios: {
      ...config.ios,
      config: {
        ...config.ios?.config,
        ...(googleMapsApiKey ? { googleMapsApiKey } : {}),
      },
    },
    extra: {
      ...config.extra,
      ...(googleMapsApiKey ? { googleMapsApiKey } : {}),
    },
  };
};
