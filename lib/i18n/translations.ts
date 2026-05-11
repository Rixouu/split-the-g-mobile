export const supportedLocales = ['en', 'th', 'fr', 'es', 'de', 'it', 'ja'] as const;

export type SupportedLocale = (typeof supportedLocales)[number];
type TranslationKey =
  | 'appName'
  | 'homeTitle'
  | 'homeSubtitle'
  | 'camera'
  | 'library'
  | 'submitPour'
  | 'signInGoogle';

export const defaultLocale: SupportedLocale = 'en';

const messages: Record<SupportedLocale, Partial<Record<TranslationKey, string>>> = {
  en: {
    appName: 'Split The G',
    homeTitle: 'Score the pour from your phone.',
    homeSubtitle:
      'Capture a Guinness, submit it through the same server-side scoring pipeline, and share the result with friends.',
    camera: 'Open camera',
    library: 'Choose from library',
    submitPour: 'Score this pour',
    signInGoogle: 'Continue with Google',
  },
  th: {},
  fr: {},
  es: {},
  de: {},
  it: {},
  ja: {},
};

export function translate(locale: SupportedLocale, key: TranslationKey): string {
  return messages[locale][key] ?? messages.en[key] ?? key;
}
