export const supportedLocales = ['en', 'th', 'fr', 'es', 'de', 'it', 'ja'] as const;

export type SupportedLocale = (typeof supportedLocales)[number];

export type TranslationKey =
  | 'appName'
  | 'navFeed'
  | 'navWall'
  | 'navPubs'
  | 'navMe'
  | 'navCompete'
  | 'navLeaderboard'
  | 'navLang'
  | 'navPour'
  | 'homeTagline'
  | 'homeSubtitle'
  | 'homeTopSplits'
  | 'homeWall'
  | 'homeHowItWorks'
  | 'homeStep1'
  | 'homeStep2'
  | 'homeStep3'
  | 'homeScorePour'
  | 'homeStartAnalysis'
  | 'homeStartHint'
  | 'camera'
  | 'library'
  | 'submitPour'
  | 'signInGoogle'
  | 'signInPrompt'
  | 'feedTitle'
  | 'feedEyebrow'
  | 'feedSubtitle'
  | 'wallTitle'
  | 'wallEyebrow'
  | 'wallSubtitle'
  | 'competeTitle'
  | 'competeEyebrow'
  | 'competeSubtitle'
  | 'competeEmpty'
  | 'competeParticipants'
  | 'languageTitle'
  | 'languageSubtitle';

export const defaultLocale: SupportedLocale = 'en';

const messages: Record<SupportedLocale, Partial<Record<TranslationKey, string>>> = {
  en: {
    appName: 'Split The G',
    navFeed: 'Feed',
    navWall: 'Wall',
    navPubs: 'Pubs',
    navMe: 'Me',
    navCompete: 'Compete',
    navLeaderboard: 'Leaderboard',
    navLang: 'Lang',
    navPour: 'Pour',
    homeTagline: 'Frame it. Split it.',
    homeSubtitle:
      'One photo of your pint, we score the G line. Share on the wall or chase the board.',
    homeTopSplits: 'Top splits',
    homeWall: 'Wall',
    homeHowItWorks: 'How it works',
    homeStep1: 'Straight-on pint, G and foam line visible.',
    homeStep2: 'Start analysis and hold still for the score.',
    homeStep3: 'Post to the wall or climb the leaderboard.',
    homeScorePour: 'Score your pour',
    homeStartAnalysis: 'Start analysis',
    homeStartHint: 'Line up the pint and hold steady, or upload below.',
    camera: 'Open camera',
    library: 'Choose from library',
    submitPour: 'Score this pour',
    signInGoogle: 'Continue with Google',
    signInPrompt: 'Sign in to claim scores and sync your leaderboard name.',
    feedTitle: 'Latest pours',
    feedEyebrow: 'Feed',
    feedSubtitle: 'Fresh splits from the community.',
    wallTitle: 'The wall',
    wallEyebrow: 'Wall',
    wallSubtitle: 'Pour cards in chronological order — same data as web.',
    competeTitle: 'Competitions',
    competeEyebrow: 'Compete',
    competeSubtitle: 'Public listings you can browse. Join flows stay on the full app.',
    competeEmpty: 'No competitions to show yet.',
    competeParticipants: '{count} in',
    languageTitle: 'Language',
    languageSubtitle: 'Choose your display language.',
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
