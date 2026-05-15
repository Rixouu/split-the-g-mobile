import fs from 'node:fs';
import path from 'node:path';

import type { ConfigContext, ExpoConfig } from 'expo/config';

/**
 * Native MapView on Android reads the key from AndroidManifest (via prebuild),
 * not from JS. EXPO_PUBLIC_* alone does not inject it — wire it here + rebuild.
 * @see https://docs.expo.dev/versions/latest/sdk/map-view/#deploy-app-with-google-maps
 *
 * Android FCM / Expo Push: add `google-services.json` from Firebase (Android app)
 * and upload the Service Account JSON to EAS — see Expo FCM credentials guide.
 * @see https://docs.expo.dev/push-notifications/fcm-credentials/
 */
export default ({ config }: ConfigContext): ExpoConfig => {
  const googleMapsApiKey = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY?.trim() ?? '';
  const googleServicesPath = path.join(__dirname, 'google-services.json');
  const googleServicesFile = fs.existsSync(googleServicesPath)
    ? './google-services.json'
    : undefined;

  return {
    ...config,
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
