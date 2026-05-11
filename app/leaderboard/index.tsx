import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { ScoreCard } from '@/components/split-the-g/score-card';
import { AppButton } from '@/components/split-the-g/button';
import { Card, Screen } from '@/components/split-the-g/screen';
import { Body, Eyebrow, Muted, Title } from '@/components/split-the-g/typography';
import { brandColors } from '@/constants/theme';
import type { PourScore } from '@/lib/api/types';
import {
  fetchLeaderboardForCountry,
  fetchLeaderboardForFriends,
  fetchLeaderboardGlobal,
  fetchProfileCountryCode,
  type LeaderboardEntry,
} from '@/lib/api/leaderboard';
import { useAuth } from '@/lib/auth/auth-context';
import { useLocale } from '@/lib/i18n/locale-context';

type LeaderTab = 'global' | 'local' | 'friends';

function entryToPourScore(e: LeaderboardEntry): PourScore {
  return {
    id: e.id,
    slug: e.slug ?? null,
    username: e.username,
    split_score: e.split_score,
    created_at: e.created_at,
    split_image_url: e.split_image_url,
    pint_image_url: null,
    g_closeup_image_url: null,
    city: null,
    region: null,
    country: null,
    country_code: e.country_code ?? null,
  };
}

export default function LeaderboardScreen() {
  const router = useRouter();
  const { t } = useLocale();
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

  return (
    <Screen>
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <View style={{ flex: 1 }}>
            <Eyebrow>{t('navLeaderboard')}</Eyebrow>
            <Title>{t('lbTitle')}</Title>
          </View>
          <Pressable onPress={() => router.push('/faq')} style={styles.faqBtn}>
            <Muted style={styles.faqBtnLabel}>{t('faqLink')}</Muted>
          </Pressable>
        </View>
        <Muted>{t('lbSubtitle')}</Muted>
        <AppButton label={t('lbCountryStats')} variant="secondary" onPress={() => router.push('/leaderboard/country-stats')} />
      </View>

      <View style={styles.tabs}>
        {(['global', 'local', 'friends'] as const).map((k) => (
          <Pressable
            key={k}
            onPress={() => setTab(k)}
            style={[styles.tab, tab === k && styles.tabActive]}
            accessibilityRole="button">
            <Body style={[styles.tabLabel, tab === k && styles.tabLabelActive]}>
              {k === 'global' ? t('lbTabGlobal') : k === 'local' ? t('lbTabLocal') : t('lbTabFriends')}
            </Body>
          </Pressable>
        ))}
      </View>

      {hint ? (
        <Card>
          <Muted>{hint}</Muted>
        </Card>
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
        <Card>
          <Muted>{t('lbEmpty')}</Muted>
        </Card>
      ) : null}

      {listQuery.data?.map((entry) => (
        <ScoreCard key={entry.id} score={entryToPourScore(entry)} previewImageUrl={entry.split_image_url} />
      ))}
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    gap: 10,
    paddingTop: 16,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  faqBtn: {
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  faqBtnLabel: {
    color: brandColors.gold,
    textDecorationLine: 'underline',
  },
  tabs: {
    flexDirection: 'row',
    gap: 8,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: brandColors.frame,
    alignItems: 'center',
  },
  tabActive: {
    borderColor: brandColors.gold,
    backgroundColor: 'rgba(179, 139, 45, 0.15)',
  },
  tabLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: brandColors.muted,
  },
  tabLabelActive: {
    color: brandColors.goldBright,
  },
});
