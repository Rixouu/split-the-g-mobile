export const supportedLocales = ['en', 'th', 'fr', 'es', 'de', 'it', 'ja'] as const;

export type SupportedLocale = (typeof supportedLocales)[number];

export type TranslationKey =
  | 'appName'
  | 'navFeed'
  | 'navWall'
  | 'navPubs'
  | 'pubsTitle'
  | 'pubsSubtitle'
  | 'pubsLoadingDirectory'
  | 'pubsDirectoryUnavailableTitle'
  | 'pubsEmptyDirectoryTitle'
  | 'pubsEmptyDirectoryBody'
  | 'pubsVenueOne'
  | 'pubsVenueMany'
  | 'pubsCardUnnamed'
  | 'pubsCardAddressPending'
  | 'pubsListingRatingsOne'
  | 'pubsListingRatingsMany'
  | 'navProfile'
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
  | 'homeUploadPhoto'
  | 'homeAnalyzingPour'
  | 'homeOneMoment'
  | 'homeNoGTitle'
  | 'homeNoGBody'
  | 'homeChangePhoto'
  | 'homeCompetitionBanner'
  | 'homeErrGenericPour'
  | 'homeErrFailedProcess'
  | 'homeErrAnalysisTimeout'
  | 'homeErrRoboflow'
  | 'homeErrRateLimited'
  | 'homeErrDuplicate'
  | 'homeErrStaleExif'
  | 'homeErrInvalidImage'
  | 'homeFeedbackShowGlass'
  | 'homeFeedbackGVisible'
  | 'homeFeedbackHoldStill'
  | 'homeFeedbackCentered'
  | 'homeFeedbackPerfect'
  | 'homeManualCapture'
  | 'homeInferenceUnavailable'
  | 'homeRoboflowKeyHint'
  | 'homeCloseLiveCamera'
  | 'homeTorchOn'
  | 'homeTorchOff'
  | 'homeCameraPermission'
  | 'homeRequestCameraPermission'
  | 'camera'
  | 'library'
  | 'submitPour'
  | 'signInGoogle'
  | 'signInPrompt'
  | 'feedTitle'
  | 'feedEyebrow'
  | 'feedSubtitle'
  | 'feedPoursSection'
  | 'feedGridIntroOne'
  | 'feedGridIntroMany'
  | 'feedLoadError'
  | 'feedEmptyState'
  | 'feedNoImage'
  | 'wallLast24'
  | 'wallTopWeek'
  | 'wallEarlier'
  | 'wallEmptyDay'
  | 'wallTopWeekEmpty'
  | 'wallArchiveEmpty'
  | 'wallLoadError'
  | 'wallTitle'
  | 'wallEyebrow'
  | 'wallSubtitle'
  | 'competeTitle'
  | 'competeEyebrow'
  | 'competeSubtitle'
  | 'competeEmpty'
  | 'competeParticipants'
  | 'competeCreateCta'
  | 'competeCreateToolbar'
  | 'competeTabOpen'
  | 'competeTabPast'
  | 'competeMineHeading'
  | 'competeOpenPastCounts'
  | 'competeListError'
  | 'competeNoCompsYet'
  | 'competeNoOpenComps'
  | 'competeNoPastComps'
  | 'competeCatalogEmptyTitle'
  | 'competeCatalogEmptyBody'
  | 'competeOpenEmptyTitle'
  | 'competeOpenEmptyBody'
  | 'competeEmptyOpenGoPast'
  | 'competePastEmptyTitle'
  | 'competePastEmptyBody'
  | 'competeCatalogFetchFailed'
  | 'competeInvitedTitle'
  | 'competeInvitedHint'
  | 'competeStatJoined'
  | 'competeStatGlasses'
  | 'competeStatRule'
  | 'competeGlassesUnlimited'
  | 'competeBadgeEnded'
  | 'competeBadgeParticipated'
  | 'competeBadgeIn'
  | 'competeBadgePrivate'
  | 'competeBadgePublic'
  | 'competeWinner'
  | 'competeWinnerDash'
  | 'competeNoPoursLogged'
  | 'competeView'
  | 'competeEdit'
  | 'competeJoin'
  | 'competeLeave'
  | 'competeFull'
  | 'competeClosed'
  | 'competeDelete'
  | 'competeSignInJoin'
  | 'competeInvitesSection'
  | 'competeInviteEmail'
  | 'competeInviteEmailHint'
  | 'competeInvitePlaceholder'
  | 'competeSendInvite'
  | 'competeRemoveInvite'
  | 'competeAddFriendsTitle'
  | 'competeAddFriendsHint'
  | 'competeAddToComp'
  | 'competeDeleteTitle'
  | 'competeDeleteMessage'
  | 'competeDeleteKeep'
  | 'competeDeleteConfirm'
  | 'competeErrDeleteOwn'
  | 'competeErrSignInJoin'
  | 'competeErrFull'
  | 'competeErrEmailInvite'
  | 'competeErrSignInInvite'
  | 'competeErrDeleteFailed'
  | 'competeErrGeneric'
  | 'competeToastDeleted'
  | 'competeToastJoined'
  | 'competeToastLeft'
  | 'competeToastInviteSent'
  | 'competeToastInviteSavedNoEmail'
  | 'competeToastInviteRemoved'
  | 'competeToastFriendAdded'
  | 'competeLoadingCatalog'
  | 'compFormErrNoName'
  | 'compFormErrTimes'
  | 'compFormErrEndAfterStart'
  | 'compFormErrMaxBelowParticipants'
  | 'compFormErrTargetRange'
  | 'compCreateTitle'
  | 'compCreateSubtitle'
  | 'compCreateSubmit'
  | 'compCreateSaving'
  | 'compCreateSignIn'
  | 'compCreateErrNoRow'
  | 'compCreatePubHint'
  | 'compCreateFieldLinkedPub'
  | 'compCreatePickPub'
  | 'compCreatePubNone'
  | 'competitionPhaseBefore'
  | 'competitionPhaseLive'
  | 'competitionPhaseAfter'
  | 'competitionLeaderboardTitle'
  | 'competitionLbRowHint'
  | 'competitionLbEmpty'
  | 'competitionJoin'
  | 'competitionLeave'
  | 'competitionRosterFull'
  | 'competitionSignInToJoin'
  | 'competitionWebHintLess'
  | 'languageTitle'
  | 'languageSubtitle'
  | 'pourResultsEyebrow'
  | 'pourResultsTitle'
  | 'pourOutOfFive'
  | 'pourMetaAllTime'
  | 'pourMetaThisWeek'
  | 'pourVenueLabel'
  | 'pourLocationLabel'
  | 'pourNoVenueSaved'
  | 'pourSplitGTitle'
  | 'pourCloseupBadge'
  | 'pourCloseupHint'
  | 'pourOriginalPourTitle'
  | 'pourFullFrameBadge'
  | 'pourAnnotatedHint'
  | 'pourNoImagePlaceholder'
  | 'pourSharePanelTitle'
  | 'pourSharePanelBlurb'
  | 'pourShareOutOfFive'
  | 'pourShareRankAllTime'
  | 'pourShareRankWeek'
  | 'pourShareEmail'
  | 'pourShareCopyText'
  | 'pourShareCopyLink'
  | 'pourShareCopied'
  | 'pourShareViaDevice'
  | 'pourShareSocialBlurb'
  | 'pourTryAgain'
  | 'pourViewTopSplits'
  | 'pourEnjoyingApp'
  | 'pourShareMailSubject'
  | 'pourShareRedditTitle'
  | 'pourShareTelegramRest'
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
  | 'lbEmptySubtitle'
  | 'lbCtaOpenProfile'
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
  | 'profileFavoritesScreenTitle'
  | 'profileFavoritesSectionTitle'
  | 'profileFavoritesSectionBlurb'
  | 'profileFavoritesSearchLabel'
  | 'profileFavoritesSaveButton'
  | 'profileFavoritesAddressHint'
  | 'profileFavoritesMaps'
  | 'profileFavoritesRemove'
  | 'profileFavoritesEmpty'
  | 'profileFavoritesPlacesPlaceholder'
  | 'pubsCardPourOne'
  | 'pubsCardPourMany'
  | 'pubsCardOutOfFive'
  | 'pubsCardRatingDotOne'
  | 'pubsCardRatingDotMany'
  | 'pubsCardNoRatingsYet'
  | 'profileNavFriends'
  | 'profileNavAchievements'
  | 'profileNavFaq'
  | 'profileScoresEmptyBlurb'
  | 'profileScoresPaid'
  | 'profileScoresRecentTitle'
  | 'profileProgressTitle'
  | 'profileProgressTotalPints'
  | 'profileProgressAvg'
  | 'profileProgressBest'
  | 'profileProgressLast7'
  | 'profileProgressStatPours'
  | 'profileProgressStatBest'
  | 'profileProgressStatAvg'
  | 'profileProgressStatLast7'
  | 'profileProgressAverage'
  | 'profileProgressLast7Pour'
  | 'profileProgressPoursSuffix'
  | 'profileProgressOutOfFiveMax'
  | 'profileProgressRecentVolume'
  | 'profileProgressVolume7dSuffix'
  | 'profileProgressAnalyticsTitle'
  | 'profileProgressAnalyticsAvgScore'
  | 'profileProgressAnalyticsTotalPints'
  | 'profileProgressAnalyticsMostPub'
  | 'profileProgressAnalyticsNoData'
  | 'profileProgressAnalyticsStreaks'
  | 'profileProgressAnalyticsStreakValues'
  | 'profileProgressScoreHistoryTitle'
  | 'profileProgressScoreHistoryBlurb'
  | 'profileProgressMomentum'
  | 'profileProgressConsistency'
  | 'profileProgressScoreDistributionTitle'
  | 'profileProgressTopBandLabel'
  | 'profileProgressTopBandFooter'
  | 'profileProgressFriendLbTitle'
  | 'profileProgressFriendLbBlurb'
  | 'profileProgressTab7d'
  | 'profileProgressTab30d'
  | 'profileProgressTab90d'
  | 'profileProgressTabAll'
  | 'profileProgressYouSuffix'
  | 'profileProgressLbPours'
  | 'profileProgressEmptyLb'
  | 'profileProgressScoreInsightsAria'
  | 'profileProgressInsightsTitle'
  | 'profileProgressInsightsBlurb'
  | 'profileProgressInsightsHistoryTitle'
  | 'profileProgressInsightsHistoryBody'
  | 'profileProgressInsightsMomentumTitle'
  | 'profileProgressInsightsMomentumBody'
  | 'profileProgressInsightsConsistencyTitle'
  | 'profileProgressInsightsConsistencyBody'
  | 'profileProgressInsightsDistributionTitle'
  | 'profileProgressInsightsDistributionBody'
  | 'profileProgressInsightsBandTitle'
  | 'profileProgressInsightsBandBody'
  | 'profileProgressLoadError'
  | 'profileExpensesTitle'
  | 'profileExpensesTotal'
  | 'profileExpensesPriced'
  | 'profileExpensesIntroBlurb'
  | 'profileExpensesSpendTrackedLabel'
  | 'profileExpensesSpendTrackedHint'
  | 'profileExpensesPricedPoursLabel'
  | 'profileExpensesAvgPriceLabel'
  | 'profileExpensesHighestPourLabel'
  | 'profileExpensesFromPricedPours'
  | 'profileExpensesRecentPricedTitle'
  | 'profileExpensesRecentPricedBlurb'
  | 'profileExpensesNoPricesYet'
  | 'profileFavoritesTitle'
  | 'profileFavoritesAdd'
  | 'profileFavoritesName'
  | 'profileFavoritesAddress'
  | 'profileFriendsTitle'
  | 'profileFriendsBlurb'
  | 'profileFriendsEmail'
  | 'profileFriendsSend'
  | 'profileFriendsAccept'
  | 'profileFriendsDecline'
  | 'profileFriendsRemove'
  | 'profileFriendsIncoming'
  | 'profileFriendsIncomingTitle'
  | 'profileFriendsOutgoing'
  | 'profileFriendsCountFriends'
  | 'profileFriendsCountIncoming'
  | 'profileFriendsCountPending'
  | 'profileFriendsYourFriendsTitle'
  | 'profileFriendsYourFriendsBlurb'
  | 'profileFriendsAcceptedCount'
  | 'profileFriendsStatAvgShort'
  | 'profileFriendsStatBestShort'
  | 'profileFriendsEmptyAccepted'
  | 'profileFriendsEmptyPending'
  | 'profileFriendsNoEmailLinked'
  | 'profileFriendsPlayerTruncated'
  | 'profileFriendsUnknownRequester'
  | 'profileFriendsSentOn'
  | 'profileFriendsCancelInvite'
  | 'profileAchievementsTitle'
  | 'profileAchievementsEmpty'
  | 'profileAchievementsHeroKicker'
  | 'profileAchievementsHeroCaption'
  | 'profileAchievementsPageBlurb'
  | 'profileAchievementsSectionBlurb'
  | 'badgeTapToShare'
  | 'badgeUnlocked'
  | 'badgeLocked'
  | 'badgePerfect'
  | 'badgePints5'
  | 'badgePints10'
  | 'badgePints25'
  | 'badgePints50'
  | 'badgePints75'
  | 'badgePints100'
  | 'badgePubCrawler'
  | 'badgePubCrawler10'
  | 'badgePubCrawler15'
  | 'badgePubCrawler20'
  | 'badgeEarlyBird'
  | 'badgeWeekendStreak'
  | 'badgeWeekendStreak6'
  | 'badgeDailyStreak7'
  | 'badgeDailyStreak14'
  | 'badgeDailyStreak30'
  | 'badgeWeeklyStreak4'
  | 'badgeHighSplit45'
  | 'badgeEliteAverage'
  | 'badgeProgressPours'
  | 'badgeProgressPubs'
  | 'badgeProgressWeekends'
  | 'badgeProgressWeeks'
  | 'badgeProgressDays'
  | 'badgeProgressBest'
  | 'badgeProgressEarly'
  | 'badgeProgressElite'
  | 'achievementShareText'
  | 'achievementShareCopied'
  | 'achievementShareFailed'
  | 'profileAccountTitle'
  | 'profileAccountDisplayName'
  | 'profileAccountNickname'
  | 'profileAccountCountry'
  | 'profileAccountSave'
  | 'profileAccountSaved'
  | 'profileAccountSignedIn'
  | 'profileAccountNamePlaceholder'
  | 'profileAccountNicknamePlaceholder'
  | 'profileAccountNicknameHint'
  | 'profileAccountCountryNotSet'
  | 'profileAccountCountrySearchPlaceholder'
  | 'profileAccountCountryNoMatches'
  | 'profileAccountCountryHint'
  | 'profileAccountSaving'
  | 'profileAccountTrackingTitle'
  | 'profileAccountTrackingBody'
  | 'profileAccountAllowAnalytics'
  | 'profileAccountDisableAnalytics'
  | 'profileAccountPushTitle'
  | 'profileAccountPushBody'
  | 'profileAccountPushEnabled'
  | 'profileAccountPushBusy'
  | 'profileAccountAnalyticsEnabledToast'
  | 'profileAccountAnalyticsDisabledToast'
  | 'profileAccountSignOutConfirmTitle'
  | 'profileAccountSignOutConfirmMessage'
  | 'profileAccountSignOutConfirmCancel'
  | 'profileAccountProfilePhotoSimpleAria'
  | 'profileAccountProfilePhotoTierAria'
  | 'profileNextSteps'
  | 'commonLoading'
  | 'actionBack'
  | 'errorSignInRequired'
  | 'errorCannotAddSelf'
  | 'errorSupabaseEnvTitle'
  | 'errorSupabaseEnvBody'
  | 'lbTitle'
  | 'lbTitleGlobalWeek'
  | 'lbTitleLocalWeek'
  | 'lbTitleFriendsWeek'
  | 'lbViewSubmissions'
  | 'lbNewSplit'
  | 'lbCountryStatsLink'
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
  | 'competitionTabLeaderboard'
  | 'competitionTabParticipants'
  | 'competitionParticipantYou'
  | 'competitionFriendStatusFriends'
  | 'competitionFriendInvite'
  | 'competitionFriendPending'
  | 'competitionFriendNoEmail'
  | 'competitionFriendSignIn'
  | 'competitionPickerDone'
  | 'competitionPickerCancel'
  | 'competitionPickStart'
  | 'competitionPickEnd'
  | 'compVenueNamePlaceholder'
  | 'competitionParticipantsEmpty'
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
  | 'profileAccountEnablePush'
  | 'profileAccountSignOut'
  | 'pourLoadError'
  | 'pubEyebrow'
  | 'pubTitleFallback'
  | 'pubLoadError'
  | 'pubNotFoundHint'
  | 'pubPageTagline'
  | 'pubDetailLocationTitle'
  | 'pubDetailLocationBlurb'
  | 'pubDetailNoAddressYet'
  | 'pubDetailMapTapHint'
  | 'pubDetailPourActivityTitle'
  | 'pubDetailPourActivityBlurb'
  | 'pubDetailStatAvgPourRating'
  | 'pubDetailStatRatedPourOne'
  | 'pubDetailStatRatedPourMany'
  | 'pubDetailStatNoRatingsYet'
  | 'pubDetailStatPours'
  | 'pubDetailStatRecordedHere'
  | 'pubDetailStatPouring'
  | 'pubDetailStatDistinctPeople'
  | 'pubDetailStatCommunitySpend'
  | 'pubDetailStatPricesOnPours'
  | 'pubDetailStatYourSpend'
  | 'pubDetailSpendSignedInHint'
  | 'pubDetailSpendSignInHint'
  | 'pubDetailStatDash'
  | 'pubDetailExtraStatsError'
  | 'pubDetailOpeningHoursTitle'
  | 'pubDetailOpeningHoursBlurb'
  | 'pubDetailHoursEmpty'
  | 'pubDetailHoursTodayBadge'
  | 'pubDetailGuinnessPromosTitle'
  | 'pubDetailDirectoryBlurbViewer'
  | 'pubDetailSectionGuinness'
  | 'pubDetailSectionPromotions'
  | 'pubDetailGuinnessEmptyHint'
  | 'pubDetailPromotionsEmptyHint'
  | 'pubDetailTabPromos'
  | 'pubDetailTabComps'
  | 'pubDetailTabWall'
  | 'pubDetailWallIntro'
  | 'pubDetailWallEmpty'
  | 'pubDetailWallError'
  | 'pubDetailWallFilters'
  | 'pubDetailWallPagerOne'
  | 'pubDetailWallPagerMany'
  | 'pubDetailWallHide'
  | 'pubDetailWallShow'
  | 'pubDetailWallSortBy'
  | 'pubDetailWallSortNewest'
  | 'pubDetailWallSortOldest'
  | 'pubDetailWallSortScoreHigh'
  | 'pubDetailWallSortScoreLow'
  | 'pubDetailWallMinScore'
  | 'pubDetailWallAnyScore'
  | 'pubDetailWallDateFrom'
  | 'pubDetailWallDateTo'
  | 'pubDetailWallDatePlaceholder'
  | 'pubDetailWallCountry'
  | 'pubDetailWallAnyCountry'
  | 'pubDetailWallNoMatch'
  | 'pubDetailWallResetFilters'
  | 'pubDetailWallPrevious'
  | 'pubDetailWallNext'
  | 'pubDetailWallPageOf'
  | 'pubDetailLinkedCompsTitle'
  | 'pubDetailLinkedCompsEmpty'
  | 'pubDetailCompOpen'
  | 'pubDetailFavorite'
  | 'pubDetailSaved'
  | 'pubDetailFavoriteBusy'
  | 'pubDetailSignInForFavorite'
  | 'pubDetailOpenMapsListing'
  | 'pubDetailOpenFullPageWeb'
  | 'pubDetailAdvertiseTitle'
  | 'pubDetailAdvertiseBody'
  | 'pubDetailAdvertiseCta'
  | 'pubDetailVenueOwnersTitle'
  | 'pubDetailVenueOwnersBody'
  | 'pubDetailOpenPubsDirectory'
  | 'pubDetailWebToolsHint'
  | 'profileDefaultName'
  | 'profileGuestEyebrow'
  | 'profileGuestTitle'
  | 'profileGuestBlurb'
  | 'profileGuestTeaser'
  | 'profileGuestFaqBlurbSuffix'
  | 'profileHubProfileLabel'
  | 'profileHubMemberSinceYear'
  | 'profileHubEdit'
  | 'profileHubStatPours'
  | 'profileHubStatScore'
  | 'profileHubStatFriends'
  | 'profileHubWeeklyBoardTitle'
  | 'profileHubWeeklySolo'
  | 'profileHubWeeklyNoScores'
  | 'profileHubWeeklyTop'
  | 'profileHubWeeklyBehind'
  | 'profileHubWeeklyRankOnly'
  | 'profileHubActivitySection'
  | 'profileHubAccountSection'
  | 'profileHubProgressSubStreak'
  | 'profileHubProgressSubPlain'
  | 'profileHubAchievementsRatio'
  | 'profileHubScoresRanked'
  | 'profileHubScoresSolo'
  | 'profileHubScoresFlagHint'
  | 'profileHubFavoritesDated'
  | 'profileHubFavoritesEmpty'
  | 'profileHubExpensesTracked'
  | 'profileHubExpensesEmpty'
  | 'profileHubFriendsOnly'
  | 'profileHubFriendsIncoming'
  | 'profileHubFriendsOutgoing'
  | 'profileHubFriendsBoth'
  | 'profileHubFaqSub'
  | 'profileHubPourCta'
  | 'profileHubRetry';

export const defaultLocale: SupportedLocale = 'en';

const messages: Record<SupportedLocale, Partial<Record<TranslationKey, string>>> = {
  en: {
    appName: 'Split The G',
    navFeed: 'Feed',
    navWall: 'Wall',
    navPubs: 'Pubs',
    pubsTitle: 'Find a Guinness nearby',
    pubsSubtitle: 'Open a pub to see the wall, stats, and how to log your split.',
    pubsLoadingDirectory: 'Loading directory…',
    pubsDirectoryUnavailableTitle: 'Pub directory unavailable',
    pubsEmptyDirectoryTitle: 'No pubs in the directory yet.',
    pubsEmptyDirectoryBody: 'Check back soon as the community adds venues.',
    pubsVenueOne: '1 venue',
    pubsVenueMany: '{count} venues',
    pubsCardUnnamed: 'Unnamed pub',
    pubsCardAddressPending: 'Address pending',
    pubsListingRatingsOne: '1 rating',
    pubsListingRatingsMany: '{count} ratings',
    navProfile: 'Profile',
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
    homeStartHint: 'Line up the pint and G, hold steady, or upload below.',
    homeUploadPhoto: 'Upload a photo instead',
    homeAnalyzingPour: 'Analyzing your split…',
    homeOneMoment: 'This will just take a moment.',
    homeNoGTitle: 'No G detected',
    homeNoGBody:
      'Please make sure the G pattern is clearly visible in your image and try again.',
    homeChangePhoto: 'Choose another photo',
    homeCompetitionBanner: 'This pour will open with your competition link after scoring.',
    homeErrGenericPour: 'Something went wrong processing your pour.',
    homeErrFailedProcess: 'Failed to process image.',
    homeErrAnalysisTimeout: 'Analysis timed out. Try a smaller photo or try again in a moment.',
    homeErrRoboflow: 'Could not reach the scoring service. Try again shortly.',
    homeErrRateLimited: 'Too many pours this hour. Try again later.',
    homeErrDuplicate: 'This exact photo was already submitted.',
    homeErrStaleExif: 'Photo date in the file looks too old. Take a new picture at the bar.',
    homeErrInvalidImage: 'Could not read that image. Try a different file.',
    homeFeedbackShowGlass: 'Show your pint glass',
    homeFeedbackGVisible: 'Make sure the G pattern is visible',
    homeFeedbackHoldStill: 'Hold still…',
    homeFeedbackCentered: 'Keep the glass centered…',
    homeFeedbackPerfect: 'Perfect! Processing your pour…',
    homeManualCapture: 'Capture manually',
    homeInferenceUnavailable:
      'Live detection hit a snag. You can still capture manually — same server scoring as the web app.',
    homeRoboflowKeyHint:
      'Set EXPO_PUBLIC_ROBOFLOW_PUBLISHABLE_KEY (same value as web VITE_ROBOFLOW_PUBLISHABLE_KEY) for automatic G detection. Manual capture still works.',
    homeCloseLiveCamera: 'Close',
    homeTorchOn: 'Torch on',
    homeTorchOff: 'Torch off',
    homeCameraPermission: 'Camera access is required for live analysis.',
    homeRequestCameraPermission: 'Allow camera',
    camera: 'Open camera',
    library: 'Choose from library',
    submitPour: 'Score this pour',
    signInGoogle: 'Continue with Google',
    signInPrompt: 'Sign in to claim scores and sync your leaderboard name.',
    feedTitle: 'Latest pours',
    feedEyebrow: 'Discover',
    feedSubtitle: 'Fresh splits from the community.',
    feedPoursSection: 'Recent pours',
    feedGridIntroOne: '1 pour',
    feedGridIntroMany: '{count} pours',
    feedLoadError: 'Could not load the feed.',
    feedEmptyState: 'No pours yet.',
    feedNoImage: 'No photo',
    wallLast24: 'Last 24 hours',
    wallTopWeek: 'Top of the week',
    wallEarlier: 'Earlier on the wall',
    wallEmptyDay: 'No pours in the last day yet.',
    wallTopWeekEmpty: 'No pours from the rest of this week yet.',
    wallArchiveEmpty: 'All visible pours are from the last 24 hours.',
    wallLoadError: 'Could not load the wall.',
    wallTitle: 'The wall',
    wallEyebrow: 'Activity',
    wallSubtitle: 'Newest community pours first, grouped by day.',
    competeTitle: 'Competitions',
    competeEyebrow: 'Compete',
    competeSubtitle: 'Browse open and past competitions, invite friends, and track standings.',
    competeEmpty: 'No competitions to show yet.',
    competeParticipants: '{count} in',
    competeCreateCta: 'New competition',
    competeCreateToolbar: 'Create',
    competeTabOpen: 'Open',
    competeTabPast: 'Past',
    competeMineHeading: 'Your competitions',
    competeOpenPastCounts: '{open} open · {past} past',
    competeListError: 'Could not load competitions: {detail}',
    competeNoCompsYet: 'No competitions match your account yet.',
    competeNoOpenComps: 'No open or upcoming competitions. Check Past for finished ones.',
    competeNoPastComps: 'No past competitions yet.',
    competeCatalogEmptyTitle: 'Your first competition starts here',
    competeCatalogEmptyBody:
      'Create a comp, invite friends, and track pours on the leaderboard right from the app.',
    competeOpenEmptyTitle: 'No open competitions',
    competeOpenEmptyBody:
      'Everything you\'re in has finished, or nothing is live yet. Browse Past for results, or start a new competition.',
    competeEmptyOpenGoPast: 'Browse past competitions',
    competePastEmptyTitle: 'No past competitions yet',
    competePastEmptyBody: 'When a competition ends, it shows up here with winners and stats.',
    competeCatalogFetchFailed: 'Could not load competitions',
    competeInvitedTitle: "You're invited",
    competeInvitedHint: 'Open a competition from the list below to join.',
    competeStatJoined: 'Joined',
    competeStatGlasses: 'Glasses each',
    competeStatRule: 'Rule',
    competeGlassesUnlimited: 'Unlimited',
    competeBadgeEnded: 'Ended',
    competeBadgeParticipated: 'You participated',
    competeBadgeIn: "You're in",
    competeBadgePrivate: 'Private',
    competeBadgePublic: 'Public',
    competeWinner: 'Winner',
    competeWinnerDash: '—',
    competeNoPoursLogged: 'No pours logged',
    competeView: 'View',
    competeEdit: 'Edit',
    competeJoin: 'Join',
    competeLeave: 'Leave',
    competeFull: 'Full',
    competeClosed: 'Closed',
    competeDelete: 'Delete',
    competeSignInJoin: 'Sign in to join',
    competeInvitesSection: 'Invites & friends',
    competeInviteEmail: 'Invite by email',
    competeInviteEmailHint: 'They get an email with a link to this competition.',
    competeInvitePlaceholder: 'friend@email.com',
    competeSendInvite: 'Send',
    competeRemoveInvite: 'Remove',
    competeAddFriendsTitle: 'Add friends',
    competeAddFriendsHint: 'Friends must already be connected on your account.',
    competeAddToComp: 'Add',
    competeDeleteTitle: 'Delete competition?',
    competeDeleteMessage: 'This removes the competition and its standings for everyone.',
    competeDeleteKeep: 'Keep',
    competeDeleteConfirm: 'Delete',
    competeErrDeleteOwn: 'You can only delete competitions you created.',
    competeErrSignInJoin: 'Sign in to join.',
    competeErrFull: 'This competition is full or unavailable.',
    competeErrEmailInvite: 'Enter a valid email address.',
    competeErrSignInInvite: 'Sign in to send invites.',
    competeErrDeleteFailed: 'Could not delete this competition.',
    competeErrGeneric: 'Something went wrong. Try again.',
    competeToastDeleted: 'Competition deleted.',
    competeToastJoined: "You're in!",
    competeToastLeft: 'You left the competition.',
    competeToastInviteSent: 'Invite sent.',
    competeToastInviteSavedNoEmail: 'Invite saved. Email could not be sent.',
    competeToastInviteRemoved: 'Invite removed.',
    competeToastFriendAdded: 'Friend added to the competition.',
    competeLoadingCatalog: 'Loading competitions…',
    compFormErrNoName: 'Enter a competition name.',
    compFormErrTimes: 'Choose start and end times.',
    compFormErrEndAfterStart: 'End must be after start.',
    compFormErrMaxBelowParticipants: 'Max participants must be at least {count} (already joined).',
    compFormErrTargetRange: 'Target score must be between 0 and 5.',
    compCreateTitle: 'New competition',
    compCreateSubtitle: 'Same rules and venue options as the web app. You need to be signed in.',
    compCreateSubmit: 'Create competition',
    compCreateSaving: 'Creating…',
    compCreateSignIn: 'Sign in with Google from Profile to create a competition.',
    compCreateErrNoRow: 'Competition was not created. Try again.',
    compCreatePubHint: 'Optional — link to a pub from our directory.',
    compCreateFieldLinkedPub: 'Linked pub',
    compCreatePickPub: 'Choose pub',
    compCreatePubNone: 'No pub linked',
    competitionPhaseBefore: 'Starts in',
    competitionPhaseLive: 'Live',
    competitionPhaseAfter: 'Ended',
    competitionLeaderboardTitle: 'Leaderboard',
    competitionLbRowHint: 'Tap a row to open the pour',
    competitionLbEmpty: 'No scored pours in this competition yet.',
    competitionJoin: 'Join competition',
    competitionLeave: 'Leave',
    competitionRosterFull: 'Roster full',
    competitionSignInToJoin: 'Sign in to join this competition.',
    competitionWebHintLess: 'Invites and some organizer tools are also on www.split-the-g.app.',
    languageTitle: 'Language',
    languageSubtitle: 'Choose your display language.',
    pourResultsEyebrow: 'Pour result',
    pourResultsTitle: 'Results',
    pourOutOfFive: 'out of 5.0',
    pourMetaAllTime: 'All-time',
    pourMetaThisWeek: 'This week',
    pourVenueLabel: 'Venue',
    pourLocationLabel: 'Location',
    pourNoVenueSaved: 'No venue saved yet.',
    pourSplitGTitle: 'Your Split G',
    pourCloseupBadge: 'Close-up',
    pourCloseupHint: 'Zoomed on the logo and foam line',
    pourOriginalPourTitle: 'Original pour',
    pourFullFrameBadge: 'Full frame',
    pourAnnotatedHint: 'Model boxes and labels on your photo',
    pourNoImagePlaceholder: 'No image available',
    pourSharePanelTitle: 'Share your split',
    pourSharePanelBlurb: 'Challenge line, score, wall ranks, and the link they tap to pour theirs.',
    pourShareOutOfFive: ' / 5.0',
    pourShareRankAllTime: '#{rank} of {total}',
    pourShareRankWeek: 'week #{rank} of {total}',
    pourShareEmail: 'Email',
    pourShareCopyText: 'Copy text',
    pourShareCopyLink: 'Copy link',
    pourShareCopied: 'Copied',
    pourShareViaDevice: 'Share via device',
    pourShareSocialBlurb:
      'Instagram has no web share. Use Copy text or Copy link, then paste in the app.',
    pourTryAgain: 'Try again',
    pourViewTopSplits: 'View top splits',
    pourEnjoyingApp: 'Enjoying Split the G?',
    pourShareMailSubject: 'Split the G challenge ({score}/5)',
    pourShareRedditTitle: 'Split the G: scored {score}/5. Can you beat this pour?',
    pourShareTelegramRest: 'I scored {score}/5. Open the link to pour yours and get scored.',
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
    lbTabLocal: 'Local',
    lbTabFriends: 'Friends',
    lbSubtitle: 'Weekly ranked splits from the whole community. Tap any row to open pours and details.',
    lbHintSignIn: 'Sign in to see this tab.',
    lbHintCountry: 'Add your country in Profile → Account to see pours from your region.',
    lbHintFriendsSolo: 'Add a friend by email in Profile → Friends to compare scores here.',
    lbEmpty: 'No pours in this view for the last 7 days yet.',
    lbEmptySubtitle: 'Scores refresh as the wall grows. Try another tab or split a new pint.',
    lbCtaOpenProfile: 'Open Profile',
    lbCountryStats: 'Country leaderboard',
    lbCountryStatsAllTime: 'All-time',
    lbCountryStats24h: 'Past 24 hours',
    faqLink: 'FAQ',
    profileHubTitle: 'Your profile',
    profileHubSubtitle: 'Scores, progress, favorites, and friends sync with the same Supabase data as the web app.',
    profileDefaultName: 'Player',
    profileGuestEyebrow: 'Profile',
    profileGuestTitle: 'Join the community',
    profileGuestBlurb:
      'Sign in with Google to link pours to your profile, compare with friends, save favorite bars, and track spend from pint prices.',
    profileGuestTeaser: 'Progress, scores, favorites, and expenses unlock after you sign in.',
    profileGuestFaqBlurbSuffix: ' — answers without signing in',
    profileHubProfileLabel: 'Profile',
    profileHubMemberSinceYear: 'Member since {year}',
    profileHubEdit: 'Edit',
    profileHubStatPours: 'Pours',
    profileHubStatScore: 'Score',
    profileHubStatFriends: 'Friends',
    profileHubWeeklyBoardTitle: "This week's friends board",
    profileHubWeeklySolo: 'Add friends on the Friends tab to see weekly rankings.',
    profileHubWeeklyNoScores: 'Log a pour this week to appear on the board.',
    profileHubWeeklyTop: "You're leading your friends on weekly average.",
    profileHubWeeklyBehind: "You're #{rank} — {gap} avg behind {name}.",
    profileHubWeeklyRankOnly: "You're #{rank} on weekly average.",
    profileHubActivitySection: 'Activity',
    profileHubAccountSection: 'Account',
    profileHubProgressSubStreak: '{count} pours logged · {streak}-day streak',
    profileHubProgressSubPlain: '{count} pours logged',
    profileHubAchievementsRatio: '{unlocked} / {total} unlocked',
    profileHubScoresRanked: '{total} pts total · rank #{rank} among friends',
    profileHubScoresSolo: '{total} pts total',
    profileHubScoresFlagHint: 'Set your country under Edit to show your flag here',
    profileHubFavoritesDated: '{count} saved · last added {date}',
    profileHubFavoritesEmpty: 'Save bars you visit',
    profileHubExpensesTracked: '{amount} tracked from priced pours',
    profileHubExpensesEmpty: 'Add pint prices on pours to track spend',
    profileHubFriendsOnly: '{count} friends',
    profileHubFriendsIncoming: '{count} friends · {incoming} incoming',
    profileHubFriendsOutgoing: '{count} friends · {outgoing} pending sent',
    profileHubFriendsBoth: '{count} friends · {incoming} incoming · {outgoing} pending sent',
    profileHubFaqSub: 'Answers about scores, friends, and your account',
    profileHubPourCta: 'Split the G',
    profileHubRetry: 'Try again',
    profileNavAccount: 'Account',
    profileNavScores: 'Scores',
    profileNavProgress: 'Progress',
    profileNavExpenses: 'Expenses',
    profileNavFavorites: 'Favorite bars',
    profileNavFriends: 'Friends',
    profileNavAchievements: 'Achievements',
    profileNavFaq: 'FAQ',
    profileScoresEmptyBlurb:
      'No scores linked to this email yet. Claim a pour to start a score log.',
    profileScoresPaid: 'Paid {amount}',
    profileScoresRecentTitle: 'Recent scores',
    profileProgressTitle: 'At a glance',
    profileProgressTotalPints: 'Total pours',
    profileProgressAvg: 'Average split',
    profileProgressBest: 'Best split',
    profileProgressLast7: 'Pours last 7 days',
    profileProgressStatPours: 'Pours',
    profileProgressStatBest: 'Best',
    profileProgressStatAvg: 'Avg / 5',
    profileProgressStatLast7: 'Last 7d',
    profileProgressAverage: 'Average',
    profileProgressLast7Pour: 'Last 7 days:',
    profileProgressPoursSuffix: 'pour(s)',
    profileProgressOutOfFiveMax: ' / 5.00',
    profileProgressRecentVolume: 'Recent volume',
    profileProgressVolume7dSuffix: ' ({count} in 7d)',
    profileProgressAnalyticsTitle: 'Detailed stats',
    profileProgressAnalyticsAvgScore: 'Average score',
    profileProgressAnalyticsTotalPints: 'Total pints',
    profileProgressAnalyticsMostPub: 'Most visited pub',
    profileProgressAnalyticsNoData: 'Not enough data yet',
    profileProgressAnalyticsStreaks: 'Streaks',
    profileProgressAnalyticsStreakValues: '{day}d daily · {week}w weekly · {weekend} weekends',
    profileProgressScoreHistoryTitle: 'Score history',
    profileProgressScoreHistoryBlurb: 'Recent trend of your pour scores (latest on the right).',
    profileProgressMomentum: 'Momentum',
    profileProgressConsistency: 'Consistency',
    profileProgressScoreDistributionTitle: 'Score distribution',
    profileProgressTopBandLabel: 'Top scoring band',
    profileProgressTopBandFooter: '{inBand} / {total} pours fall in this range.',
    profileProgressFriendLbTitle: 'Friends leaderboard',
    profileProgressFriendLbBlurb: 'Compare your average, best score, and volume against accepted friends.',
    profileProgressTab7d: '7d',
    profileProgressTab30d: '30d',
    profileProgressTab90d: '90d',
    profileProgressTabAll: 'All',
    profileProgressYouSuffix: ' · You',
    profileProgressLbPours: '{count} pours',
    profileProgressEmptyLb: 'Accept a few friends to unlock side-by-side progress comparisons.',
    profileProgressScoreInsightsAria: 'Open score insights help',
    profileProgressInsightsTitle: 'How score insights work',
    profileProgressInsightsBlurb: 'Quick guide to the stats shown in this section.',
    profileProgressInsightsHistoryTitle: 'Score history',
    profileProgressInsightsHistoryBody:
      'Shows your most recent pours with date and score so you can spot short-term form changes.',
    profileProgressInsightsMomentumTitle: 'Momentum',
    profileProgressInsightsMomentumBody:
      'Difference between your latest score and the one before it. Positive means improving.',
    profileProgressInsightsConsistencyTitle: 'Consistency',
    profileProgressInsightsConsistencyBody:
      'Standard deviation (sigma) of your scores. Lower means steadier pours.',
    profileProgressInsightsDistributionTitle: 'Score distribution',
    profileProgressInsightsDistributionBody:
      'How your pours are spread across score bands (count and percentage).',
    profileProgressInsightsBandTitle: 'Top scoring band',
    profileProgressInsightsBandBody: 'The score range where you land most often. Useful for setting your next target.',
    profileProgressLoadError: 'Could not load profile data. Go back to Profile and try opening Progress again.',
    profileExpensesTitle: 'Spend tracked',
    profileExpensesTotal: 'Total (priced pints)',
    profileExpensesPriced: 'Pours with a price',
    profileExpensesIntroBlurb:
      'Spend totals use pint prices you enter on pours (optional field). Figures below are from your recent linked scores loaded in this session.',
    profileExpensesSpendTrackedLabel: 'Spend tracked',
    profileExpensesSpendTrackedHint:
      'Sum of pint prices you entered on pours (only pours with a price count toward this total).',
    profileExpensesPricedPoursLabel: 'Priced pours',
    profileExpensesAvgPriceLabel: 'Avg price',
    profileExpensesHighestPourLabel: 'Highest pour',
    profileExpensesFromPricedPours: 'From your priced pours',
    profileExpensesRecentPricedTitle: 'Recent pours with a price',
    profileExpensesRecentPricedBlurb:
      'Tap through to the full score. Add or edit price from the pour flow if you skipped it.',
    profileExpensesNoPricesYet:
      'No prices on your recent pours yet. Next time you split, add the pint price to build a spend history.',
    profileFavoritesTitle: 'Favorite pubs',
    profileFavoritesScreenTitle: 'Favorite bars',
    profileFavoritesSectionTitle: 'Favorite bars',
    profileFavoritesSectionBlurb: 'Save pubs you visit; we use Places for accurate addresses.',
    profileFavoritesSearchLabel: 'Search (Google Places)',
    profileFavoritesSaveButton: 'Save favorite',
    profileFavoritesAddressHint: 'Choose a suggestion when possible so we store the full address.',
    profileFavoritesMaps: 'Maps',
    profileFavoritesRemove: 'Remove',
    profileFavoritesEmpty: 'No favorites yet.',
    profileFavoritesPlacesPlaceholder: 'Search for a bar in Thailand or type the name',
    pubsCardPourOne: '1 pour',
    pubsCardPourMany: '{count} pours',
    pubsCardOutOfFive: '/ 5',
    pubsCardRatingDotOne: '· 1 rating',
    pubsCardRatingDotMany: '· {count} ratings',
    pubsCardNoRatingsYet: 'No ratings yet',
    profileFavoritesAdd: 'Save pub',
    profileFavoritesName: 'Pub name',
    profileFavoritesAddress: 'Address (optional)',
    profileFriendsTitle: 'Friends & invites',
    profileFriendsBlurb:
      'Invite people by email from here. If they create an account later with that same email, they will see the pending friend request and any competition invites. They still choose whether to accept the friendship or join the competition.',
    profileFriendsEmail: 'Friend email',
    profileFriendsSend: 'Send request',
    profileFriendsAccept: 'Accept',
    profileFriendsDecline: 'Decline',
    profileFriendsRemove: 'Remove',
    profileFriendsIncoming: 'Incoming',
    profileFriendsIncomingTitle: 'Incoming requests',
    profileFriendsOutgoing: 'Pending sent',
    profileFriendsCountFriends: 'Friends',
    profileFriendsCountIncoming: 'Incoming',
    profileFriendsCountPending: 'Pending',
    profileFriendsYourFriendsTitle: 'Your friends',
    profileFriendsYourFriendsBlurb:
      'Accepted friends appear here with a quick performance snapshot.',
    profileFriendsAcceptedCount: '{count} accepted',
    profileFriendsStatAvgShort: 'Avg',
    profileFriendsStatBestShort: 'Best',
    profileFriendsEmptyAccepted: 'No accepted friends yet. Send a few requests above.',
    profileFriendsEmptyPending: 'No pending requests right now.',
    profileFriendsNoEmailLinked: 'No email linked yet',
    profileFriendsPlayerTruncated: 'Player {id}…',
    profileFriendsUnknownRequester: 'Someone wants to connect',
    profileFriendsSentOn: 'Sent {date}',
    profileFriendsCancelInvite: 'Cancel invite',
    profileAchievementsTitle: 'Achievements',
    profileAchievementsEmpty: 'No achievements unlocked yet — keep pouring!',
    profileAchievementsHeroKicker: 'Achievements',
    profileAchievementsHeroCaption: 'badges unlocked',
    profileAchievementsPageBlurb:
      'All badges use your linked pours. New unlocks appear here after your next pour syncs.',
    profileAchievementsSectionBlurb: 'Unlock badges by pouring consistently and exploring more pubs.',
    badgeTapToShare: 'Tap to share',
    badgeUnlocked: 'Unlocked',
    badgeLocked: 'Locked',
    badgePerfect: 'Perfect Score',
    badgePints5: '5 Pints Poured',
    badgePints10: '10 Pints Poured',
    badgePints25: '25 Pints Poured',
    badgePints50: '50 Pints Poured',
    badgePints75: '75 Pints Poured',
    badgePints100: '100 Pints Poured',
    badgePubCrawler: 'Pub Crawler (5 pubs)',
    badgePubCrawler10: 'Pub Explorer (10 pubs)',
    badgePubCrawler15: 'Pub Voyager (15 pubs)',
    badgePubCrawler20: 'Pub Legend (20 pubs)',
    badgeEarlyBird: 'Early Bird (before 5 PM)',
    badgeWeekendStreak: 'Weekend Warrior (3 weekends)',
    badgeWeekendStreak6: 'Weekend Champion (6 weekends)',
    badgeDailyStreak7: '7-Day Streak',
    badgeDailyStreak14: '14-Day Streak',
    badgeDailyStreak30: '30-Day Streak',
    badgeWeeklyStreak4: 'Weekly Regular (4 weeks in a row)',
    badgeHighSplit45: 'Hot Hand (best split 4.50+)',
    badgeEliteAverage: 'Elite Average (10 pours, 4.3+ avg)',
    badgeProgressPours: '{current} / {target} pours',
    badgeProgressPubs: '{current} / {target} different pubs',
    badgeProgressWeekends: '{current} / {target} weekend streak',
    badgeProgressWeeks: '{current} / {target} weeks with a pour',
    badgeProgressDays: '{current} / {target} consecutive days',
    badgeProgressBest: 'Best split {best} (goal {target})',
    badgeProgressEarly: 'Pour once before 5 PM (your local time)',
    badgeProgressElite: '{pours} / 10 pours · avg {avg} (goal 4.30)',
    achievementShareText: 'I unlocked “{name}” on Split the G.',
    achievementShareCopied: 'Achievements link copied.',
    achievementShareFailed: 'Couldn’t copy the link. Try sharing from the system share sheet.',
    profileAccountTitle: 'Account',
    profileAccountDisplayName: 'Full name',
    profileAccountNickname: 'Nickname (leaderboard)',
    profileAccountCountry: 'Country',
    profileAccountSave: 'Save profile',
    profileAccountSaved: 'Profile saved',
    profileAccountSignedIn: 'Signed in',
    profileAccountNamePlaceholder: 'Your name',
    profileAccountNicknamePlaceholder: 'Optional — shown instead of full name',
    profileAccountNicknameHint:
      'Leave blank to use your full name on feeds and boards. Must be unique (letters including accents, numbers, spaces, - or _). 2–30 characters.',
    profileAccountCountryNotSet: 'Not set',
    profileAccountCountrySearchPlaceholder: 'Search countries…',
    profileAccountCountryNoMatches: 'No matching countries.',
    profileAccountCountryHint:
      'Shown as a flag next to your name. Local leaderboard lists top pours this week from everyone who chose this same country on their profile.',
    profileAccountSaving: 'Saving…',
    profileAccountTrackingTitle: 'Tracking preference',
    profileAccountTrackingBody: 'Choose whether analytics can be used to improve app flows.',
    profileAccountAllowAnalytics: 'Allow analytics',
    profileAccountDisableAnalytics: 'Disable analytics',
    profileAccountPushTitle: 'Push notifications',
    profileAccountPushBody:
      'Get alerts for friend requests, competition invites, friend pours, and top 10 changes.',
    profileAccountPushEnabled: 'Notifications enabled',
    profileAccountPushBusy: 'Updating…',
    profileAccountAnalyticsEnabledToast: 'Analytics enabled.',
    profileAccountAnalyticsDisabledToast: 'Analytics disabled.',
    profileAccountSignOutConfirmTitle: 'Sign out?',
    profileAccountSignOutConfirmMessage:
      "You'll need to sign in again to manage your profile, friends, and favorites.",
    profileAccountSignOutConfirmCancel: 'Stay signed in',
    profileAccountProfilePhotoSimpleAria: 'Profile photo',
    profileAccountProfilePhotoTierAria:
      'Profile photo with achievement tier {tier}; {unlocked} of {total} badges unlocked.',
    profileNextSteps: 'Edit details on each screen above.',
    commonLoading: 'Loading…',
    actionBack: 'Back',
    errorSignInRequired: 'Sign in required',
    errorCannotAddSelf: "You can't add yourself as a friend.",
    errorSupabaseEnvTitle: 'Supabase env is missing.',
    errorSupabaseEnvBody: 'Configure EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY.',
    lbTitle: 'Top pours',
    lbTitleGlobalWeek: 'Top splits this week',
    lbTitleLocalWeek: 'Your country this week',
    lbTitleFriendsWeek: 'Friends & you this week',
    lbViewSubmissions: 'View Submissions',
    lbNewSplit: 'New Split',
    lbCountryStatsLink: 'Country leaderboard',
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
    competitionTabLeaderboard: 'Leaderboard',
    competitionTabParticipants: "Who's in",
    competitionParticipantYou: 'You',
    competitionFriendStatusFriends: 'Friends',
    competitionFriendInvite: 'Add friend',
    competitionFriendPending: 'Invite sent',
    competitionFriendNoEmail: 'No email on file',
    competitionFriendSignIn: 'Sign in to add friends',
    competitionPickerDone: 'Done',
    competitionPickerCancel: 'Cancel',
    competitionPickStart: 'Start time',
    competitionPickEnd: 'End time',
    compVenueNamePlaceholder: 'Search Google Maps…',
    competitionParticipantsEmpty: 'No one has joined this competition yet.',
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
    profileFriendsPlaceholder: 'friend@email.com',
    profileFriendsInviteSent: 'Invite sent',
    profileAccountEnablePush: 'Enable push notifications',
    profileAccountSignOut: 'Sign out',
    pourLoadError: 'Could not load this pour',
    pubEyebrow: 'Pub',
    pubTitleFallback: 'Pub',
    pubLoadError: 'Could not load this pub.',
    pubNotFoundHint:
      'No stats row for this venue key. It may still exist on the web directory.',
    pubPageTagline: 'Community pours, ratings, and optional pub notes.',
    pubDetailLocationTitle: 'Location & map',
    pubDetailLocationBlurb:
      'Location reflects where the community has poured at this pub. Use the map to preview the area, or open Google Maps for directions and the full listing.',
    pubDetailNoAddressYet: 'No saved address yet — map search uses the pub name only.',
    pubDetailMapTapHint: 'Tap to open in Google Maps',
    pubDetailPourActivityTitle: 'Pour activity',
    pubDetailPourActivityBlurb: 'Ratings and spend from scores tagged with this pub name.',
    pubDetailStatAvgPourRating: 'Avg pour rating',
    pubDetailStatRatedPourOne: '{count} rated pour',
    pubDetailStatRatedPourMany: '{count} rated pours',
    pubDetailStatNoRatingsYet: 'No ratings yet',
    pubDetailStatPours: 'Pours',
    pubDetailStatRecordedHere: 'Recorded here',
    pubDetailStatPouring: 'Pouring',
    pubDetailStatDistinctPeople: 'Distinct people (approx.)',
    pubDetailStatCommunitySpend: 'Community $',
    pubDetailStatPricesOnPours: 'Prices entered on pours',
    pubDetailStatYourSpend: 'Your spend',
    pubDetailSpendSignedInHint: 'Your pours with a price, this pub.',
    pubDetailSpendSignInHint: 'Sign in to see your total.',
    pubDetailStatDash: '—',
    pubDetailExtraStatsError:
      'Could not load pour spend stats. If this persists, apply migration 20260328260000_pub_details_and_comp_bar_link.',
    pubDetailOpeningHoursTitle: 'Opening hours',
    pubDetailOpeningHoursBlurb:
      'Live hours from Google appear on the website when a Place ID is linked. Directory notes (if any) show below on mobile.',
    pubDetailHoursEmpty:
      'No directory hours text yet. On the web, hours from the Google Business Profile show here when linked.',
    pubDetailHoursTodayBadge: 'Today',
    pubDetailGuinnessPromosTitle: 'Guinness & promos',
    pubDetailDirectoryBlurbViewer:
      'Community notes — visible to everyone. Updates are managed by the team (same as the web pub page).',
    pubDetailSectionGuinness: 'Guinness',
    pubDetailSectionPromotions: 'Promotions & drinks',
    pubDetailGuinnessEmptyHint: 'Taps, pour quality, nitro — nothing added yet.',
    pubDetailPromotionsEmptyHint: 'Nothing added yet.',
    pubDetailTabPromos: 'Promos',
    pubDetailTabComps: 'Competitions',
    pubDetailTabWall: 'Wall',
    pubDetailWallIntro:
      'Pours tagged with this pub — same filters and sorting as the web wall (up to {count} rows from the server).',
    pubDetailWallEmpty: 'No pours recorded for this pub name yet. Be the first from the home screen.',
    pubDetailWallError: 'Wall: {message}',
    pubDetailWallFilters: 'Filters',
    pubDetailWallPagerOne: '{count} pour · Page {page} / {totalPages}',
    pubDetailWallPagerMany: '{count} pours · Page {page} / {totalPages}',
    pubDetailWallHide: 'Hide',
    pubDetailWallShow: 'Show',
    pubDetailWallSortBy: 'Sort by',
    pubDetailWallSortNewest: 'Newest first',
    pubDetailWallSortOldest: 'Oldest first',
    pubDetailWallSortScoreHigh: 'Highest score',
    pubDetailWallSortScoreLow: 'Lowest score',
    pubDetailWallMinScore: 'Minimum score',
    pubDetailWallAnyScore: 'Any score',
    pubDetailWallDateFrom: 'From (YYYY-MM-DD)',
    pubDetailWallDateTo: 'To (YYYY-MM-DD)',
    pubDetailWallDatePlaceholder: 'YYYY-MM-DD',
    pubDetailWallCountry: 'Country',
    pubDetailWallAnyCountry: 'Any country',
    pubDetailWallNoMatch: 'No pours match these filters.',
    pubDetailWallResetFilters: 'Reset filters',
    pubDetailWallPrevious: 'Previous',
    pubDetailWallNext: 'Next',
    pubDetailWallPageOf: '{page} / {totalPages}',
    pubDetailLinkedCompsTitle: 'Linked competitions',
    pubDetailLinkedCompsEmpty: 'No active competition linked. Organizers can attach this pub when creating or editing a comp.',
    pubDetailCompOpen: 'Open competition',
    pubDetailFavorite: 'Favorite',
    pubDetailSaved: 'Saved',
    pubDetailFavoriteBusy: '…',
    pubDetailSignInForFavorite: 'Sign in to save this pub to your favorites.',
    pubDetailOpenMapsListing: 'Open saved Maps link',
    pubDetailOpenFullPageWeb: 'Open full pub page on the web',
    pubDetailAdvertiseTitle: 'Banner ads',
    pubDetailAdvertiseBody:
      'Put your brand or venue in front of pourers. Ask about placements, formats, and rates.',
    pubDetailAdvertiseCta: 'Contact',
    pubDetailVenueOwnersTitle: 'Claiming, advertising, or importing venue data',
    pubDetailVenueOwnersBody:
      'On the web, venue owners use mailto links and banners on the pubs list, plus admin sections on the pub detail page. There is no separate “new pub” route — workflows live under Pubs and each pub URL.',
    pubDetailOpenPubsDirectory: 'Open pubs on the web',
    pubDetailWebToolsHint:
      'Google import, merge duplicates, and directory edits stay on the web app (admin only).',
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

export function translateVars(
  locale: SupportedLocale,
  key: TranslationKey,
  vars: Record<string, string | number>,
): string {
  let s = translate(locale, key);
  for (const [k, v] of Object.entries(vars)) {
    s = s.split(`{${k}}`).join(String(v));
  }
  return s;
}

export function getPourCelebrationLine(locale: SupportedLocale, splitScore: number): string {
  if (splitScore >= 4.7) return translate(locale, 'pourCelebrationHigh');
  if (splitScore >= 3.75) return translate(locale, 'pourCelebrationMidHigh');
  if (splitScore >= 3.0) return translate(locale, 'pourCelebrationMid');
  return translate(locale, 'pourCelebrationLow');
}

export function getPourShareHookLine(locale: SupportedLocale, splitScore: number): string {
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
  const hook = getPourShareHookLine(locale, params.splitScore);
  const body = translate(locale, 'pourShareBody')
    .replace(/\{score\}/g, s)
    .replace(/\{allTimeRank\}/g, String(params.allTimeRank))
    .replace(/\{totalSplits\}/g, String(params.totalSplits))
    .replace(/\{weeklyRank\}/g, String(params.weeklyRank))
    .replace(/\{weeklyTotalSplits\}/g, String(params.weeklyTotalSplits))
    .replace(/\{shareUrl\}/g, params.shareUrl);
  return `${hook}\n\n${body}`;
}

export function buildPourTweetText(
  locale: SupportedLocale,
  params: { shareUrl: string; splitScore: number },
): string {
  const hook = getPourShareHookLine(locale, params.splitScore);
  const s = params.splitScore.toFixed(2);
  const long = `${hook} I scored ${s}/5 on Split the G. Pour yours: ${params.shareUrl}`;
  if (long.length <= 280) return long;
  return `${hook} ${s}/5 on Split the G: ${params.shareUrl}`;
}

export function buildPourTelegramBlurb(locale: SupportedLocale, splitScore: number): string {
  const hook = getPourShareHookLine(locale, splitScore);
  const s = splitScore.toFixed(2);
  const rest = translate(locale, 'pourShareTelegramRest').replace(/\{score\}/g, s);
  return `${hook} ${rest}`;
}
