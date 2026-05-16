import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { LeaderboardEntryRow } from '@/components/leaderboard/leaderboard-entry-row';
import { AppButton } from '@/components/split-the-g/button';
import { Card, Screen, UNDER_STACK_HEADER_SAFE_AREA_EDGES } from '@/components/split-the-g/screen';
import { ScreenLoadingBlock } from '@/components/split-the-g/screen-loading';
import { Body, Muted } from '@/components/split-the-g/typography';
import { brandColors } from '@/constants/theme';
import {
  fetchLeaderboardForCountry,
  fetchLeaderboardForFriends,
  fetchLeaderboardGlobal,
  fetchProfileCountryCode,
} from '@/lib/api/leaderboard';
import { useAuth } from '@/lib/auth/auth-context';
import { useLocale } from '@/lib/i18n/locale-context';
import type { TranslationKey } from '@/lib/i18n/translations';

type LeaderTab = 'global' | 'local' | 'friends';

function titleKeyForTab(tab: LeaderTab): TranslationKey {
  if (tab === 'local') return 'lbTitleLocalWeek';
  if (tab === 'friends') return 'lbTitleFriendsWeek';
  return 'lbTitleGlobalWeek';
}

type HintKind =
  | { kind: 'signIn' }
  | { kind: 'country' }
  | { kind: 'friendsSolo' };

export default function LeaderboardScreen() {
  const router = useRouter();
  const { t, locale } = useLocale();
  const { user } = useAuth();
  const [tab, setTab] = useState<LeaderTab>('global');

  const countryQuery = useQuery({
    queryKey: ['publicProfileCountry', user?.id],
    queryFn: () => fetchProfileCountryCode(user!.id),
    enabled: Boolean(user?.id) && tab === 'local',
  });

  const countryCode = countryQuery.data ?? null;

  const listQuery = useQuery({
    queryKey: ['leaderboard', tab, user?.id, user?.email, countryCode],
    queryFn: async () => {
      if (tab === 'global') return fetchLeaderboardGlobal(15);
      if (tab === 'local') {
        if (!countryCode) return [];
        return fetchLeaderboardForCountry(countryCode, 15);
      }
      if (!user) return [];
      return fetchLeaderboardForFriends(user.id, user.email ?? null, 15);
    },
    enabled:
      tab === 'global' ||
      (tab === 'local' && Boolean(user?.id) && countryQuery.isFetched) ||
      (tab === 'friends' && Boolean(user?.id)),
  });

  const hintKind = useMemo((): HintKind | null => {
    if ((tab === 'friends' || tab === 'local') && !user) return { kind: 'signIn' };
    if (tab === 'local' && user && countryQuery.isFetched && !countryCode) return { kind: 'country' };
    if (
      tab === 'friends' &&
      user &&
      listQuery.isFetched &&
      listQuery.data &&
      listQuery.data.length === 0
    )
      return { kind: 'friendsSolo' };
    return null;
  }, [
    tab,
    user,
    countryCode,
    countryQuery.isFetched,
    listQuery.isFetched,
    listQuery.data,
  ]);

  const hintText = useMemo(() => {
    if (!hintKind) return null;
    if (hintKind.kind === 'signIn') return t('lbHintSignIn');
    if (hintKind.kind === 'country') return t('lbHintCountry');
    return t('lbHintFriendsSolo');
  }, [hintKind, t]);

  const titleKey = titleKeyForTab(tab);

  const isLoadingBlock =
    listQuery.isLoading || (tab === 'local' && countryQuery.isLoading && Boolean(user?.id));

  const listRows = listQuery.data ?? [];
  const showList =
    Boolean(user || tab === 'global') &&
    !hintKind &&
    !listQuery.error &&
    !isLoadingBlock &&
    listRows.length > 0;

  return (
    <Screen contentContainerStyle={styles.scrollInner} edges={UNDER_STACK_HEADER_SAFE_AREA_EDGES}>
      <View style={styles.constrain}>
        <View style={styles.header}>
          <View style={styles.titleRow}>
            <Text style={styles.pageTitle}>{t(titleKey)}</Text>
            <Pressable onPress={() => router.push('/faq')} style={styles.faqBtn} accessibilityRole="button">
              <Muted style={styles.faqBtnLabel}>{t('faqLink')}</Muted>
            </Pressable>
          </View>
          <Muted style={styles.subtitle}>{t('lbSubtitle')}</Muted>

          <View style={styles.inlineLinks}>
            <Pressable onPress={() => router.push('/leaderboard/country-stats')} accessibilityRole="button">
              <Muted style={styles.linkText}>{t('lbCountryStatsLink')}</Muted>
            </Pressable>
          </View>

          <AppButton
            label={t('lbViewSubmissions')}
            variant="primary"
            onPress={() => router.push('/feed?tab=wall')}
            style={styles.primaryCta}
          />
        </View>

        {/* Inset segmented control: avoids “square” active tab tearing outer rounded corners */}
        <View style={styles.segmentOuter} accessibilityRole="tablist">
          {(['global', 'local', 'friends'] as const).map((k) => {
            const active = tab === k;
            const label =
              k === 'global' ? t('lbTabGlobal') : k === 'local' ? t('lbTabLocal') : t('lbTabFriends');
            return (
              <Pressable
                key={k}
                onPress={() => setTab(k)}
                style={[styles.segmentChip, active && styles.segmentChipActive]}
                accessibilityRole="tab"
                accessibilityState={{ selected: active }}>
                <Text style={[styles.segmentLabel, active && styles.segmentLabelActive]} numberOfLines={1}>
                  {label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {isLoadingBlock ? <ScreenLoadingBlock /> : null}

        {listQuery.error ? (
          <Card>
            <Body>{t('lbError')}</Body>
            <Muted>{listQuery.error.message}</Muted>
          </Card>
        ) : null}

        {hintKind && hintText ? (
          <View style={styles.stateCard}>
            <View style={styles.stateIconWrap} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
              {hintKind.kind === 'signIn' ? (
                <Ionicons name="log-in-outline" size={28} color={brandColors.goldBright} />
              ) : hintKind.kind === 'country' ? (
                <Ionicons name="flag-outline" size={28} color={brandColors.goldBright} />
              ) : (
                <Ionicons name="people-outline" size={28} color={brandColors.goldBright} />
              )}
            </View>
            <Body style={styles.stateTitle}>{hintText}</Body>
            {hintKind.kind === 'signIn' ? (
              <AppButton
                label={t('lbCtaOpenProfile')}
                variant="secondary"
                shape="pill"
                onPress={() => router.push('/profile')}
              />
            ) : hintKind.kind === 'country' ? (
              <AppButton
                label={t('profileNavAccount')}
                variant="secondary"
                shape="pill"
                onPress={() => router.push('/profile/account')}
              />
            ) : (
              <AppButton
                label={t('profileNavFriends')}
                variant="secondary"
                shape="pill"
                onPress={() => router.push('/profile/friends')}
              />
            )}
          </View>
        ) : null}

        {!isLoadingBlock && !listQuery.error && !hintKind && listRows.length === 0 ? (
          <View style={styles.stateCard}>
            <View style={styles.stateIconWrap} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
              <Ionicons name="trophy-outline" size={28} color={brandColors.goldBright} />
            </View>
            <Body style={styles.stateTitle}>{t('lbEmpty')}</Body>
            <Muted style={styles.stateMuted}>{t('lbEmptySubtitle')}</Muted>
            <Pressable style={styles.wallTap} onPress={() => router.push('/feed?tab=wall')} accessibilityRole="button">
              <Text style={styles.wallTapText}>{t('navWall')} →</Text>
            </Pressable>
          </View>
        ) : null}

        {showList ? (
          <View style={styles.list}>
            {listRows.map((entry, index) => (
              <LeaderboardEntryRow key={entry.id} entry={entry} rank={index + 1} locale={locale} />
            ))}
          </View>
        ) : null}
      </View>

      <View style={styles.footerWrap}>
        <AppButton
          label={t('lbNewSplit')}
          variant="secondary"
          onPress={() => router.push('/')}
          style={styles.footerCta}
        />
      </View>
    </Screen>
  );
}

const CONTENT_MAX_WIDTH = 520;

const styles = StyleSheet.create({
  scrollInner: {
    alignItems: 'center',
  },
  constrain: {
    width: '100%',
    maxWidth: CONTENT_MAX_WIDTH,
    gap: 16,
    paddingBottom: 8,
  },
  header: {
    gap: 12,
    paddingTop: 8,
    width: '100%',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    width: '100%',
  },
  pageTitle: {
    flex: 1,
    color: brandColors.gold,
    fontSize: 26,
    fontWeight: '800',
    letterSpacing: -0.4,
    lineHeight: 30,
  },
  faqBtn: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    marginTop: 2,
  },
  faqBtnLabel: {
    color: brandColors.gold,
    textDecorationLine: 'underline',
    fontSize: 13,
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 20,
    color: 'rgba(212, 183, 143, 0.78)',
  },
  inlineLinks: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  linkText: {
    color: brandColors.goldBright,
    textDecorationLine: 'underline',
    fontSize: 13,
  },
  primaryCta: {
    alignSelf: 'stretch',
  },
  segmentOuter: {
    flexDirection: 'row',
    alignItems: 'stretch',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: brandColors.pourCardStroke,
    backgroundColor: 'rgba(11, 11, 11, 0.55)',
    padding: 4,
    gap: 6,
    minHeight: 52,
  },
  segmentChip: {
    flex: 1,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 4,
    borderRadius: 10,
    backgroundColor: 'transparent',
  },
  segmentChipActive: {
    backgroundColor: brandColors.gold,
  },
  segmentLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: 'rgba(212, 183, 143, 0.88)',
    textAlign: 'center',
    letterSpacing: 0.02,
  },
  segmentLabelActive: {
    color: brandColors.black,
  },
  stateCard: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: brandColors.pourCardStroke,
    backgroundColor: 'rgba(29, 24, 15, 0.45)',
    paddingVertical: 22,
    paddingHorizontal: 16,
    alignItems: 'center',
    gap: 12,
  },
  stateIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(179, 139, 45, 0.25)',
    backgroundColor: 'rgba(212, 183, 143, 0.06)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stateTitle: {
    textAlign: 'center',
    color: brandColors.cream,
    lineHeight: 22,
    fontWeight: '600',
  },
  stateMuted: {
    textAlign: 'center',
    fontSize: 13,
    lineHeight: 19,
    color: 'rgba(212, 183, 143, 0.65)',
    paddingHorizontal: 4,
  },
  wallTap: {
    marginTop: 2,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(179, 139, 45, 0.35)',
  },
  wallTapText: {
    fontSize: 14,
    fontWeight: '800',
    color: brandColors.gold,
    letterSpacing: 0.3,
    textAlign: 'center',
  },
  list: {
    gap: 14,
    alignSelf: 'stretch',
  },
  footerWrap: {
    width: '100%',
    maxWidth: CONTENT_MAX_WIDTH,
    marginTop: 12,
    alignSelf: 'center',
  },
  footerCta: {
    alignSelf: 'stretch',
  },
});
