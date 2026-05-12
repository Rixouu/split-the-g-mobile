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

function valueFromEnv(key: string, fallback = ''): string {
  return process.env[key] ?? fallback;
}

function normalizeUrl(url: string): string {
  return url.trim().replace(/\/$/, '');
}

export const appConfig = {
  siteUrl: normalizeUrl(
    valueFromEnv('EXPO_PUBLIC_SITE_URL', extra.siteUrl ?? 'https://split-the-g.vercel.app'),
  ),
  apiBaseUrl: normalizeUrl(
    valueFromEnv(
      'EXPO_PUBLIC_API_BASE_URL',
      extra.apiBaseUrl ?? extra.siteUrl ?? 'https://split-the-g.vercel.app',
    ),
  ),
  supabaseUrl: valueFromEnv('EXPO_PUBLIC_SUPABASE_URL', extra.supabaseUrl ?? ''),
  supabaseAnonKey: valueFromEnv(
    'EXPO_PUBLIC_SUPABASE_ANON_KEY',
    extra.supabaseAnonKey ?? '',
  ),
  googleMapsApiKey: valueFromEnv(
    'EXPO_PUBLIC_GOOGLE_MAPS_API_KEY',
    extra.googleMapsApiKey ?? '',
  ),
  posthogKey: valueFromEnv('EXPO_PUBLIC_POSTHOG_KEY', extra.posthogKey ?? ''),
  posthogHost: valueFromEnv(
    'EXPO_PUBLIC_POSTHOG_HOST',
    extra.posthogHost ?? 'https://us.i.posthog.com',
  ),
  /** Same defaults as web `useHomePourClient` (`VITE_ROBOFLOW_*`). */
  roboflowPublishableKey: valueFromEnv(
    'EXPO_PUBLIC_ROBOFLOW_PUBLISHABLE_KEY',
    valueFromEnv('EXPO_PUBLIC_ROBOFLOW_API_KEY', extra.roboflowPublishableKey ?? ''),
  ),
  roboflowInferenceModel: valueFromEnv(
    'EXPO_PUBLIC_ROBOFLOW_INFERENCE_MODEL',
    extra.roboflowInferenceModel ?? 'split-g-label-experiment',
  ),
  roboflowInferenceVersion: valueFromEnv(
    'EXPO_PUBLIC_ROBOFLOW_INFERENCE_VERSION',
    extra.roboflowInferenceVersion ?? '8',
  ),
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
