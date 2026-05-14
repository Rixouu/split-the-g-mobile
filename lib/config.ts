import Constants from 'expo-constants';

interface AppExtraConfig {
  siteUrl?: string;
  apiBaseUrl?: string;
  supabaseUrl?: string;
  supabaseAnonKey?: string;
  googleMapsApiKey?: string;
  posthogKey?: string;
  posthogHost?: string;
  roboflowPublishableKey?: string;
  roboflowInferenceModel?: string;
  roboflowInferenceVersion?: string;
}

const extra = (Constants.expoConfig?.extra ?? {}) as AppExtraConfig;

/**
 * Expo / Metro only inlines EXPO_PUBLIC_* when accessed as literals, e.g.
 * `process.env.EXPO_PUBLIC_FOO`. Dynamic `process.env[key]` survives bundling but
 * is empty in release builds — EAS dashboard vars still won't show up via helpers.
 */

function normalizeUrl(url: string): string {
  return url.trim().replace(/\/$/, '');
}

export const appConfig = {
  siteUrl: normalizeUrl(
    process.env.EXPO_PUBLIC_SITE_URL ?? extra.siteUrl ?? 'https://www.split-the-g.app',
  ),
  apiBaseUrl: normalizeUrl(
    process.env.EXPO_PUBLIC_API_BASE_URL ??
      extra.apiBaseUrl ??
      extra.siteUrl ??
      'https://www.split-the-g.app',
  ),
  supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL ?? extra.supabaseUrl ?? '',
  supabaseAnonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? extra.supabaseAnonKey ?? '',
  googleMapsApiKey:
    process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY ?? extra.googleMapsApiKey ?? '',
  posthogKey: process.env.EXPO_PUBLIC_POSTHOG_KEY ?? extra.posthogKey ?? '',
  posthogHost:
    process.env.EXPO_PUBLIC_POSTHOG_HOST ?? extra.posthogHost ?? 'https://us.i.posthog.com',
  /** Same defaults as web `useHomePourClient` (`VITE_ROBOFLOW_*`). */
  roboflowPublishableKey:
    process.env.EXPO_PUBLIC_ROBOFLOW_PUBLISHABLE_KEY ??
    process.env.EXPO_PUBLIC_ROBOFLOW_API_KEY ??
    extra.roboflowPublishableKey ??
    '',
  roboflowInferenceModel:
    process.env.EXPO_PUBLIC_ROBOFLOW_INFERENCE_MODEL ??
    extra.roboflowInferenceModel ??
    'split-g-label-experiment',
  roboflowInferenceVersion:
    process.env.EXPO_PUBLIC_ROBOFLOW_INFERENCE_VERSION ?? extra.roboflowInferenceVersion ?? '8',
  appScheme: 'splittheg',
};

export function hasSupabaseConfig(): boolean {
  return Boolean(appConfig.supabaseUrl && appConfig.supabaseAnonKey);
}

/** Publishable key + model id — used for live hosted detect (same model as web Inference.js). */
export function hasRoboflowLiveDetectConfig(): boolean {
  return Boolean(
    appConfig.roboflowPublishableKey.trim() &&
      appConfig.roboflowInferenceModel.trim() &&
      appConfig.roboflowInferenceVersion.trim(),
  );
}
