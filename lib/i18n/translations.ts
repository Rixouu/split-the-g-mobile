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
  | 'languageSubtitle'
  | 'pourResultsEyebrow'
  | 'pourAnonymousDisplay'
  | 'pourCelebrationHigh'
  | 'pourCelebrationMidHigh'
  | 'pourCelebrationMid'
  | 'pourCelebrationLow'
  | 'pourRankAllTime'
  | 'pourRankThisWeek'
  | 'pourRankSplitsRecorded'
  | 'pourRankSplitsThisWeek'
  | 'pourShareResult'
  | 'pourCopyLink'
  | 'pourLinkCopied'
  | 'pourLeaderboard'
  | 'pourBuyCreatorBeer'
  | 'pourOpenInMaps'
  | 'pourViewPub'
  | 'pourShareHookHigh'
  | 'pourShareHookMid'
  | 'pourShareHookLow'
  | 'pourShareBody'
  | 'pourCompBanner'
  | 'pourOpenCompetition'
  | 'pourVenueTitle'
  | 'pourFieldBarName'
  | 'pourFieldBarAddress'
  | 'pourFieldRating'
  | 'pourFieldPrice'
  | 'pourSaveVenue'
  | 'pourVenueSaved'
  | 'pourClaimTitle'
  | 'pourClaimBody'
  | 'pourClaimButton'
  | 'pourUnclaimButton'
  | 'pourUnclaimConfirmTitle'
  | 'pourUnclaimConfirmMessage'
  | 'pourMsgClaimOk'
  | 'pourMsgClaimFail'
  | 'pourMsgUnclaimOk'
  | 'pourMsgUnclaimFail'
  | 'pourMsgAttachCompOk'
  | 'pourMsgAttachCompFail'
  | 'errorBarNameRequired'
  | 'errorRatingRange'
  | 'errorPintPriceBad'
  | 'errorPintPriceLarge'
  | 'errorGeofenceVenue'
  | 'errorSaveVenue'
  | 'pourOwnerOnlyHint'
  | 'pourSignedInAs'
  | 'pourClaiming'
  | 'pourUnclaiming'
  | 'pourClaimedLabel'
  | 'actionCancel'
  | 'actionConfirm'
  | 'faqPageTitle'
  | 'faqPageSubtitle'
  | 'faqQSplitTheG'
  | 'faqASplitTheG'
  | 'faqQWhatAppDoes'
  | 'faqAWhatAppDoesIntro'
  | 'faqAWhatAppDoesMid1'
  | 'faqAWhatAppDoesMid2'
  | 'faqAWhatAppDoesMid3'
  | 'faqAWhatAppDoesOutro'
  | 'faqQHowScore'
  | 'faqAHowScore'
  | 'faqQGuinnessOnly'
  | 'faqAGuinnessOnly'
  | 'faqQFree'
  | 'faqAFree'
  | 'faqQGlassTypes'
  | 'faqAGlassTypes'
  | 'faqQPhotoTips'
  | 'faqAPhotoTips'
  | 'faqQShareScore'
  | 'faqAShareScore'
  | 'faqQHigherScore'
  | 'faqAHigherScore'
  | 'faqQSupport'
  | 'faqASupport'
  | 'lbTabGlobal'
  | 'lbTabLocal'
  | 'lbTabFriends'
  | 'lbSubtitle'
  | 'lbHintSignIn'
  | 'lbHintCountry'
  | 'lbHintFriendsSolo'
  | 'lbEmpty'
  | 'lbCountryStats'
  | 'lbCountryStatsAllTime'
  | 'lbCountryStats24h'
  | 'faqLink'
  | 'profileHubTitle'
  | 'profileHubSubtitle'
  | 'profileNavAccount'
  | 'profileNavScores'
  | 'profileNavProgress'
  | 'profileNavExpenses'
  | 'profileNavFavorites'
  | 'profileNavFriends'
  | 'profileNavAchievements'
  | 'profileNavFaq'
  | 'profileScoresEmpty'
  | 'profileProgressTitle'
  | 'profileProgressTotalPints'
  | 'profileProgressAvg'
  | 'profileProgressBest'
  | 'profileProgressLast7'
  | 'profileExpensesTitle'
  | 'profileExpensesTotal'
  | 'profileExpensesPriced'
  | 'profileFavoritesTitle'
  | 'profileFavoritesAdd'
  | 'profileFavoritesName'
  | 'profileFavoritesAddress'
  | 'profileFriendsTitle'
  | 'profileFriendsEmail'
  | 'profileFriendsSend'
  | 'profileFriendsAccept'
  | 'profileFriendsDecline'
  | 'profileFriendsRemove'
  | 'profileFriendsIncoming'
  | 'profileFriendsOutgoing'
  | 'profileAchievementsTitle'
  | 'profileAchievementsEmpty'
  | 'profileAccountTitle'
  | 'profileAccountDisplayName'
  | 'profileAccountNickname'
  | 'profileAccountCountry'
  | 'profileAccountSave'
  | 'profileAccountSaved'
  | 'profileNextSteps'
  | 'commonLoading'
  | 'actionBack'
  | 'errorSignInRequired'
  | 'errorCannotAddSelf'
  | 'errorSupabaseEnvTitle'
  | 'errorSupabaseEnvBody'
  | 'lbTitle'
  | 'lbError'
  | 'lbCountryStatsBlurbAllTime'
  | 'lbCountryStatsBlurb24h'
  | 'lbCountryStatsError'
  | 'lbStatRowMeta'
  | 'scoreRedirectOpening'
  | 'scoreRedirectErrorTitle'
  | 'scoreRedirectInvalid'
  | 'scoreRedirectNotFound'
  | 'competitionEyebrow'
  | 'competitionLoadError'
  | 'competitionNotFound'
  | 'competitionRulePrefix'
  | 'competitionMetaLine'
  | 'competitionTargetSegment'
  | 'competitionWebHint'
  | 'competitionEditCTA'
  | 'competitionLinkedPub'
  | 'competitionOpenPub'
  | 'competitionBackToList'
  | 'compEditLoadError'
  | 'compEditNotAllowed'
  | 'compEditFieldName'
  | 'compEditFieldMaxParticipants'
  | 'compEditFieldGlasses'
  | 'compEditFieldWinRule'
  | 'compEditFieldTarget'
  | 'compEditFieldStart'
  | 'compEditFieldEnd'
  | 'compEditDatetimePlaceholder'
  | 'compEditPublic'
  | 'compEditPrivate'
  | 'compEditVenueName'
  | 'compEditVenueAddress'
  | 'compEditLinkedBarKey'
  | 'compEditSave'
  | 'compEditSaving'
  | 'compEditCancel'
  | 'compEditBack'
  | 'compEditWinHighest'
  | 'compEditWinLowest'
  | 'compEditWinAvg'
  | 'compEditWinClosest'
  | 'compEditWinMost'
  | 'profileFavoritesNamePlaceholder'
  | 'profileFriendsPlaceholder'
  | 'profileFriendsInviteSent'
  | 'profileFriendsListSection'
  | 'profileAccountEnablePush'
  | 'profileAccountSignOut'
  | 'pourLoadError'
  | 'pubEyebrow'
  | 'pubTitleFallback'
  | 'pubLoadError'
  | 'pubNotFoundHint';

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
    pourResultsEyebrow: 'Pour result',
    pourAnonymousDisplay: 'Anonymous drinker',
    pourCelebrationHigh: 'Exceptional split — that line is razor sharp.',
    pourCelebrationMidHigh: 'Solid pour — great eye on the G.',
    pourCelebrationMid: 'Nice work — room to tighten the line.',
    pourCelebrationLow: 'Keep practising — every pint is data.',
    pourRankAllTime: 'All-time rank',
    pourRankThisWeek: 'This week',
    pourRankSplitsRecorded: 'Total splits recorded',
    pourRankSplitsThisWeek: 'New splits this week',
    pourShareResult: 'Share result',
    pourCopyLink: 'Copy link',
    pourLinkCopied: 'Link copied',
    pourLeaderboard: 'Leaderboard',
    pourBuyCreatorBeer: 'Buy the creator a beer',
    pourOpenInMaps: 'Open in Google Maps',
    pourViewPub: 'View pub',
    pourShareHookHigh: 'Think you can split the G cleaner?',
    pourShareHookMid: 'How close can you get to the perfect split?',
    pourShareHookLow: 'Grab a pint and try to beat this line.',
    pourShareBody:
      'Split score: {score}\nAll-time: #{allTimeRank} of {totalSplits}\nThis week: #{weeklyRank} of {weeklyTotalSplits}\n\n{shareUrl}',
    pourCompBanner:
      'Opened from a competition link. Save venue details below to attach this pour (sign in required for attach).',
    pourOpenCompetition: 'Open competition',
    pourVenueTitle: 'Venue & pour details',
    pourFieldBarName: 'Pub / bar name',
    pourFieldBarAddress: 'Address (optional)',
    pourFieldRating: 'Pour rating (0–5)',
    pourFieldPrice: 'Pint price (optional)',
    pourSaveVenue: 'Save details',
    pourVenueSaved: 'Saved',
    pourClaimTitle: 'Claim this pour',
    pourClaimBody:
      'Sign in with the same Google account you want on the leaderboard, then claim to link this score to your profile.',
    pourClaimButton: 'Claim with Google',
    pourUnclaimButton: 'Unclaim pour',
    pourUnclaimConfirmTitle: 'Unclaim this pour?',
    pourUnclaimConfirmMessage: 'Your email will be removed from this score and a new random name will be assigned.',
    pourMsgClaimOk: 'Pour claimed.',
    pourMsgClaimFail: 'Could not claim this pour.',
    pourMsgUnclaimOk: 'Pour unclaimed.',
    pourMsgUnclaimFail: 'Could not unclaim.',
    pourMsgAttachCompOk: 'Added to competition.',
    pourMsgAttachCompFail: 'Could not add to competition.',
    errorBarNameRequired: 'Bar name is required.',
    errorRatingRange: 'Rating must be between 0 and 5.',
    errorPintPriceBad: 'Enter a valid pint price or leave blank.',
    errorPintPriceLarge: 'Pint price is too large.',
    errorGeofenceVenue: 'Move closer to the selected venue to confirm you are there.',
    errorSaveVenue: 'Could not save details.',
    pourOwnerOnlyHint: 'Only the person who submitted this pour can edit these fields.',
    pourSignedInAs: 'Signed in as {email}',
    pourClaiming: 'Claiming…',
    pourUnclaiming: 'Unclaiming…',
    pourClaimedLabel: 'Linked: {email}',
    actionCancel: 'Cancel',
    actionConfirm: 'Unclaim',
    faqPageTitle: 'Frequently asked questions',
    faqPageSubtitle: 'Quick answers about scoring, sharing, and the app.',
    faqQSplitTheG: 'What is "Split the G"?',
    faqASplitTheG:
      '"Split the G" is the Guinness challenge where you sip your pint so the foam line lands in the middle of the "G" in the harp logo. It\'s part skill, part steady hands, and part luck.',
    faqQWhatAppDoes: 'What does this app do?',
    faqAWhatAppDoesIntro:
      'Split the G scores that pour from a photo. You get a score from 0 to 5. Use the app to browse the',
    faqAWhatAppDoesMid1: ', open pours for detail, explore',
    faqAWhatAppDoesMid2: '(venues wall), check',
    faqAWhatAppDoesMid3: ', and browse',
    faqAWhatAppDoesOutro:
      '. Sign in with Google from Profile for a saved profile, friends, favorites, and competition invites.',
    faqQHowScore: 'How does the app score my pint?',
    faqAHowScore:
      'The app looks for a Guinness pint glass and logo in your photo, then compares where the foam line sits relative to the center of the "G". That becomes a score from 0 (way off) to 5 (as close as the model can tell). Results depend on lighting, angle, and image quality; it\'s a fun guide, not a lab measurement.',
    faqQGuinnessOnly: 'Do I have to drink Guinness to use the app?',
    faqAGuinnessOnly:
      'Yes. Scoring is built around the standard Guinness glass and harp logo. Other beers or glass shapes aren\'t supported.',
    faqQFree: 'Is the app free?',
    faqAFree:
      'Yes. There are no paywalls for pouring, browsing, or competitions, and no ads in the app today.',
    faqQGlassTypes: 'Can I use older or non-standard Guinness glasses?',
    faqAGlassTypes:
      'The model is trained on the familiar curved pint with a clear "G". Etched, faded, or unusual glassware may score less reliably. Better photos usually help more than a perfect glass.',
    faqQPhotoTips: 'How should I take the photo?',
    faqAPhotoTips:
      'Face the glass straight-on so the full harp and foam line are visible. Avoid harsh glare and very dark corners. Use a straight-on shot before you submit.',
    faqQShareScore: 'Can I share my score?',
    faqAShareScore:
      'Each pour has its own page you can open from the feed or wall. Copy the link from share, or screenshot your result and share it anywhere you like.',
    faqQHigherScore: 'How can I get a higher score?',
    faqAHigherScore:
      'Start with a well poured pint, then sip slowly and stop when the line looks centered on the "G". Small adjustments beat big gulps. If the model seems off, try a clearer, straighter photo next time.',
    faqQSupport: 'How can I support the creator?',
    faqASupport:
      "Split the G is a solo project and free to use. If it's been fun for you and you'd like to say thanks, you can buy the creator a beer. It helps cover hosting, APIs, and time spent improving the app.",
    lbTabGlobal: 'Global',
    lbTabLocal: 'My country',
    lbTabFriends: 'Friends',
    lbSubtitle: 'Top pours from the last 7 days (when server ranking is available).',
    lbHintSignIn: 'Sign in to see this tab.',
    lbHintCountry: 'Add your country in Profile → Account to see pours from your region.',
    lbHintFriendsSolo: 'Add a friend by email in Profile → Friends to compare scores here.',
    lbEmpty: 'No scores in this view yet.',
    lbCountryStats: 'Country leaderboard',
    lbCountryStatsAllTime: 'All-time',
    lbCountryStats24h: 'Past 24 hours',
    faqLink: 'FAQ',
    profileHubTitle: 'Your profile',
    profileHubSubtitle: 'Scores, progress, favorites, and friends sync with the same Supabase data as the web app.',
    profileNavAccount: 'Account',
    profileNavScores: 'My scores',
    profileNavProgress: 'Progress',
    profileNavExpenses: 'Expenses',
    profileNavFavorites: 'Favorite pubs',
    profileNavFriends: 'Friends',
    profileNavAchievements: 'Achievements',
    profileNavFaq: 'FAQ',
    profileScoresEmpty: 'Claim pours with Google from a pour detail page to see them here.',
    profileProgressTitle: 'At a glance',
    profileProgressTotalPints: 'Total pours',
    profileProgressAvg: 'Average split',
    profileProgressBest: 'Best split',
    profileProgressLast7: 'Pours last 7 days',
    profileExpensesTitle: 'Spend tracked',
    profileExpensesTotal: 'Total (priced pints)',
    profileExpensesPriced: 'Pours with a price',
    profileFavoritesTitle: 'Favorite pubs',
    profileFavoritesAdd: 'Save pub',
    profileFavoritesName: 'Pub name',
    profileFavoritesAddress: 'Address (optional)',
    profileFriendsTitle: 'Friends',
    profileFriendsEmail: 'Friend email',
    profileFriendsSend: 'Send invite',
    profileFriendsAccept: 'Accept',
    profileFriendsDecline: 'Decline',
    profileFriendsRemove: 'Remove',
    profileFriendsIncoming: 'Incoming',
    profileFriendsOutgoing: 'Pending sent',
    profileAchievementsTitle: 'Achievements',
    profileAchievementsEmpty: 'No achievements unlocked yet — keep pouring!',
    profileAccountTitle: 'Public profile',
    profileAccountDisplayName: 'Display name',
    profileAccountNickname: 'Leaderboard nickname',
    profileAccountCountry: 'Country (ISO code, e.g. GB)',
    profileAccountSave: 'Save profile',
    profileAccountSaved: 'Profile saved',
    profileNextSteps: 'Edit details on each screen above.',
    commonLoading: 'Loading…',
    actionBack: 'Back',
    errorSignInRequired: 'Sign in required',
    errorCannotAddSelf: "You can't add yourself as a friend.",
    errorSupabaseEnvTitle: 'Supabase env is missing.',
    errorSupabaseEnvBody: 'Configure EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY.',
    lbTitle: 'Top pours',
    lbError: 'Leaderboard unavailable',
    lbCountryStatsBlurbAllTime: 'Aggregated pours by country (all-time).',
    lbCountryStatsBlurb24h: 'Aggregated pours by country (past 24 hours).',
    lbCountryStatsError: 'Could not load stats',
    lbStatRowMeta: '{count} pours · avg {avg}',
    scoreRedirectOpening: 'Opening pour…',
    scoreRedirectErrorTitle: 'Could not open this pour',
    scoreRedirectInvalid: 'Invalid score link.',
    scoreRedirectNotFound: 'This pour could not be found.',
    competitionEyebrow: 'Competition',
    competitionLoadError: 'Could not load this competition.',
    competitionNotFound:
      'Competition not found, or you do not have access. Private competitions may require the web app and sign-in.',
    competitionRulePrefix: 'Rule:',
    competitionMetaLine:
      'Visibility: {visibility} · Max participants: {max} · Glasses / person: {glasses}',
    competitionTargetSegment: ' · target {score}',
    competitionWebHint:
      'Join, invites, and live in-competition boards may still need the web app depending on your account.',
    competitionEditCTA: 'Edit competition',
    competitionLinkedPub: 'Linked pub',
    competitionOpenPub: 'Open pub →',
    competitionBackToList: 'Back to competitions list',
    compEditLoadError: 'Could not load competition.',
    compEditNotAllowed: 'Only the competition creator can edit this event.',
    compEditFieldName: 'Name',
    compEditFieldMaxParticipants: 'Max participants',
    compEditFieldGlasses: 'Glasses per person (ignored for “most submissions”)',
    compEditFieldWinRule: 'Win rule',
    compEditFieldTarget: 'Target score (0–5)',
    compEditFieldStart: 'Start (local)',
    compEditFieldEnd: 'End (local)',
    compEditDatetimePlaceholder: 'YYYY-MM-DDTHH:mm',
    compEditPublic: 'Public — anyone can discover',
    compEditPrivate: 'Private — invite only',
    compEditVenueName: 'Venue name',
    compEditVenueAddress: 'Venue address',
    compEditLinkedBarKey: 'Linked pub bar key (optional)',
    compEditSave: 'Save changes',
    compEditSaving: 'Saving…',
    compEditCancel: 'Cancel',
    compEditBack: 'Back',
    compEditWinHighest: 'Highest score',
    compEditWinLowest: 'Lowest split',
    compEditWinAvg: 'Best average',
    compEditWinClosest: 'Closest to target',
    compEditWinMost: 'Most submissions',
    profileFavoritesNamePlaceholder: 'e.g. The Crown',
    profileFriendsPlaceholder: 'friend@example.com',
    profileFriendsInviteSent: 'Invite sent',
    profileFriendsListSection: 'Friends',
    profileAccountEnablePush: 'Enable push notifications',
    profileAccountSignOut: 'Sign out',
    pourLoadError: 'Could not load this pour',
    pubEyebrow: 'Pub',
    pubTitleFallback: 'Pub',
    pubLoadError: 'Could not load this pub.',
    pubNotFoundHint:
      'No stats row for this venue key. It may still exist on the web directory.',
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

export function getPourCelebrationLine(locale: SupportedLocale, splitScore: number): string {
  if (splitScore >= 4.7) return translate(locale, 'pourCelebrationHigh');
  if (splitScore >= 3.75) return translate(locale, 'pourCelebrationMidHigh');
  if (splitScore >= 3.0) return translate(locale, 'pourCelebrationMid');
  return translate(locale, 'pourCelebrationLow');
}

function shareChallengeHeadline(locale: SupportedLocale, splitScore: number): string {
  if (splitScore >= 4.5) return translate(locale, 'pourShareHookHigh');
  if (splitScore >= 3.5) return translate(locale, 'pourShareHookMid');
  return translate(locale, 'pourShareHookLow');
}

export function buildPourShareMessage(
  locale: SupportedLocale,
  params: {
    shareUrl: string;
    splitScore: number;
    allTimeRank: number;
    totalSplits: number;
    weeklyRank: number;
    weeklyTotalSplits: number;
  },
): string {
  const s = params.splitScore.toFixed(2);
  const hook = shareChallengeHeadline(locale, params.splitScore);
  const body = translate(locale, 'pourShareBody')
    .replace(/\{score\}/g, s)
    .replace(/\{allTimeRank\}/g, String(params.allTimeRank))
    .replace(/\{totalSplits\}/g, String(params.totalSplits))
    .replace(/\{weeklyRank\}/g, String(params.weeklyRank))
    .replace(/\{weeklyTotalSplits\}/g, String(params.weeklyTotalSplits))
    .replace(/\{shareUrl\}/g, params.shareUrl);
  return `${hook}\n\n${body}`;
}
