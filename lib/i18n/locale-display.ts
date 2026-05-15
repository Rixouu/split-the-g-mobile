import type { SupportedLocale } from '@/lib/i18n/translations';
import { flagEmojiFromIso2 } from '@/lib/utils/country-display';

/**
 * Representative region for each app UI locale (flag only). Language codes stay as locale ids (en, th, …).
 */
const LOCALE_REPRESENTATIVE_REGION: Record<SupportedLocale, string> = {
  en: 'US',
  th: 'TH',
  fr: 'FR',
  es: 'ES',
  de: 'DE',
  it: 'IT',
  ja: 'JP',
};

export function localeFlagEmoji(locale: SupportedLocale): string {
  return flagEmojiFromIso2(LOCALE_REPRESENTATIVE_REGION[locale]);
}

/** Uppercase language tag for badges (e.g. EN, JA). */
export function localeLanguageTag(locale: SupportedLocale): string {
  return locale.toUpperCase();
}

/** Compact trailing label: "🇺🇸 EN". */
export function formatLocaleBadge(locale: SupportedLocale): string {
  return `${localeFlagEmoji(locale)} ${localeLanguageTag(locale)}`;
}
