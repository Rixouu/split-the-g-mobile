import AsyncStorage from '@react-native-async-storage/async-storage';

/** Same key as web `split-the-g` `stg_analytics_consent_v1` for consistent semantics. */
const CONSENT_KEY = 'stg_analytics_consent_v1';

export type AnalyticsConsentStatus = 'accepted' | 'rejected' | 'unset';

let memoryConsent: AnalyticsConsentStatus = 'unset';

export function getCachedAnalyticsConsent(): AnalyticsConsentStatus {
  return memoryConsent;
}

export async function initAnalyticsConsent(): Promise<void> {
  try {
    const value = await AsyncStorage.getItem(CONSENT_KEY);
    if (value === 'accepted' || value === 'rejected') memoryConsent = value;
    else memoryConsent = 'unset';
  } catch {
    memoryConsent = 'unset';
  }
}

export async function persistAnalyticsConsent(status: 'accepted' | 'rejected'): Promise<void> {
  memoryConsent = status;
  await AsyncStorage.setItem(CONSENT_KEY, status);
}
