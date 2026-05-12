import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { LeaderboardEntryRow } from '@/components/leaderboard/leaderboard-entry-row';
import { AppButton } from '@/components/split-the-g/button';
import { Card, Screen } from '@/components/split-the-g/screen';
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

  const hint = useMemo(() => {
    if (tab === 'friends' && !user) return t('lbHintSignIn');
    if (tab === 'local' && !user) return t('lbHintSignIn');
    if (tab === 'local' && user && countryQuery.isFetched && !countryCode) return t('lbHintCountry');
    if (tab === 'friends' && user && listQuery.isFetched && listQuery.data?.length === 0)
      return t('lbHintFriendsSolo');
    return null;
  }, [tab, user, countryCode, countryQuery.isFetched, listQuery.isFetched, listQuery.data?.length, t]);

  const titleKey = titleKeyForTab(tab);

  return (
    <Screen>
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

      <View style={styles.segment} accessibilityRole="tablist">
        {(['global', 'local', 'friends'] as const).map((k) => {
          const active = tab === k;
          const label =
            k === 'global' ? t('lbTabGlobal') : k === 'local' ? t('lbTabLocal') : t('lbTabFriends');
          return (
            <Pressable
              key={k}
              onPress={() => setTab(k)}
              style={[styles.segmentTab, active && styles.segmentTabActive]}
              accessibilityRole="tab"
              accessibilityState={{ selected: active }}>
              <Text style={[styles.segmentLabel, active && styles.segmentLabelActive]}>{label}</Text>
            </Pressable>
          );
        })}
      </View>

      {hint ? (
        <View style={styles.hintBanner}>
          <Text style={styles.hintText}>{hint}</Text>
        </View>
      ) : null}

      {listQuery.isLoading || (tab === 'local' && countryQuery.isLoading) ? (
        <Card>
          <Body>{t('commonLoading')}</Body>
        </Card>
      ) : null}

      {listQuery.error ? (
        <Card>
          <Body>{t('lbError')}</Body>
          <Muted>{listQuery.error.message}</Muted>
        </Card>
      ) : null}

      {!listQuery.isLoading && !listQuery.error && (listQuery.data?.length ?? 0) === 0 && !hint ? (
        <View style={styles.emptyBanner}>
          <Text style={styles.emptyText}>{t('lbEmpty')}</Text>
        </View>
      ) : null}

      <View style={styles.list}>
        {listQuery.data?.map((entry, index) => (
          <LeaderboardEntryRow key={entry.id} entry={entry} rank={index + 1} locale={locale} />
        ))}
      </View>

      <AppButton
        label={t('lbNewSplit')}
        variant="outlineGold"
        onPress={() => router.push('/')}
        style={styles.footerCta}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    gap: 12,
    paddingTop: 8,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
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
  segment: {
    flexDirection: 'row',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: brandColors.pourCardStroke,
    backgroundColor: 'rgba(11, 11, 11, 0.45)',
    overflow: 'hidden',
    minHeight: 48,
  },
  segmentTab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 6,
  },
  segmentTabActive: {
    backgroundColor: brandColors.gold,
  },
  segmentLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: 'rgba(212, 183, 143, 0.85)',
    textAlign: 'center',
  },
  segmentLabelActive: {
    color: brandColors.black,
  },
  hintBanner: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(179, 139, 45, 0.22)',
    backgroundColor: 'rgba(29, 24, 15, 0.4)',
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  hintText: {
    fontSize: 13,
    lineHeight: 18,
    color: 'rgba(253, 251, 243, 0.88)',
  },
  emptyBanner: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: brandColors.pourCardStroke,
    backgroundColor: 'rgba(29, 24, 15, 0.3)',
    paddingVertical: 28,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    textAlign: 'center',
    color: 'rgba(212, 183, 143, 0.72)',
    lineHeight: 20,
  },
  list: {
    gap: 16,
  },
  footerCta: {
    alignSelf: 'stretch',
    marginTop: 8,
  },
});
