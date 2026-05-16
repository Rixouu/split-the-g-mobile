import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { AppButton } from '@/components/split-the-g/button';
import { Card, Screen, UNDER_STACK_HEADER_SAFE_AREA_EDGES } from '@/components/split-the-g/screen';
import { ScreenLoadingBlock } from '@/components/split-the-g/screen-loading';
import { Body, Muted } from '@/components/split-the-g/typography';
import { brandColors } from '@/constants/theme';
import { fetchCountryStats24h, fetchCountryStatsAllTime, type CountryStatRow } from '@/lib/api/leaderboard';
import { useLocale } from '@/lib/i18n/locale-context';

type Segment = 'all' | '24h';

const CONTENT_MAX_WIDTH = 520;

function flagHint(code: string): string {
  const c = code.trim().toUpperCase();
  if (c.length !== 2) return '';
  const A = 0x1f1e6;
  const a = 'A'.charCodeAt(0);
  const chars = [...c].map((ch) => A + (ch.charCodeAt(0) - a));
  try {
    return String.fromCodePoint(...chars);
  } catch {
    return '';
  }
}

function StatRow({ row }: { row: CountryStatRow }) {
  const { t } = useLocale();
  const avg = Number(row.average_score);
  const avgLabel = Number.isFinite(avg) ? avg.toFixed(2) : '—';
  const emoji = row.country_code ? flagHint(row.country_code) : '';
  return (
    <View style={styles.statCard}>
      <Body style={styles.statTitle}>
        {emoji ? `${emoji} ` : ''}
        {row.country}
      </Body>
      <Muted style={styles.statMeta}>
        {t('lbStatRowMeta').replace('{count}', String(row.submission_count)).replace('{avg}', avgLabel)}
      </Muted>
    </View>
  );
}

export default function CountryStatsLeaderboardScreen() {
  const router = useRouter();
  const { t } = useLocale();
  const [segment, setSegment] = useState<Segment>('all');

  const allTime = useQuery({
    queryKey: ['countryStats', 'all'],
    queryFn: fetchCountryStatsAllTime,
    enabled: segment === 'all',
  });

  const past24 = useQuery({
    queryKey: ['countryStats', '24h'],
    queryFn: fetchCountryStats24h,
    enabled: segment === '24h',
  });

  const active = segment === 'all' ? allTime : past24;
  const rows = active.data ?? [];

  const blurb = segment === '24h' ? t('lbCountryStatsBlurb24h') : t('lbCountryStatsBlurbAllTime');
  const emptyTitle = segment === '24h' ? t('lbCountryStatsEmpty24h') : t('lbCountryStatsEmptyAllTime');

  return (
    <Screen contentContainerStyle={styles.scrollInner} edges={UNDER_STACK_HEADER_SAFE_AREA_EDGES}>
      <View style={styles.constrain}>
        <View style={styles.header}>
          <View style={styles.titleRow}>
            <Text style={styles.pageTitle}>{t('lbCountryStats')}</Text>
            <Pressable onPress={() => router.push('/faq')} style={styles.faqBtn} accessibilityRole="button">
              <Muted style={styles.faqBtnLabel}>{t('faqLink')}</Muted>
            </Pressable>
          </View>
          <Muted style={styles.subtitle}>{blurb}</Muted>

          <View style={styles.inlineLinks}>
            <Pressable onPress={() => router.push('/leaderboard')} accessibilityRole="button">
              <Muted style={styles.linkText}>{t('lbWeeklyLeaderboardLink')}</Muted>
            </Pressable>
          </View>

          <AppButton
            label={t('lbViewSubmissions')}
            variant="primary"
            onPress={() => router.push('/feed?tab=wall')}
            style={styles.primaryCta}
          />
        </View>

        <View style={styles.segmentOuter} accessibilityRole="tablist">
          <Pressable
            onPress={() => setSegment('all')}
            style={[styles.segmentChip, segment === 'all' && styles.segmentChipActive]}
            accessibilityRole="tab"
            accessibilityState={{ selected: segment === 'all' }}>
            <Text style={[styles.segmentLabel, segment === 'all' && styles.segmentLabelActive]} numberOfLines={1}>
              {t('lbCountryStatsAllTime')}
            </Text>
          </Pressable>
          <Pressable
            onPress={() => setSegment('24h')}
            style={[styles.segmentChip, segment === '24h' && styles.segmentChipActive]}
            accessibilityRole="tab"
            accessibilityState={{ selected: segment === '24h' }}>
            <Text style={[styles.segmentLabel, segment === '24h' && styles.segmentLabelActive]} numberOfLines={1}>
              {t('lbCountryStats24h')}
            </Text>
          </Pressable>
        </View>

        {active.isLoading ? <ScreenLoadingBlock /> : null}

        {active.error ? (
          <Card>
            <Body>{t('lbCountryStatsError')}</Body>
            <Muted>{active.error.message}</Muted>
          </Card>
        ) : null}

        {!active.isLoading && !active.error && rows.length === 0 ? (
          <View style={styles.stateCard}>
            <View style={styles.stateIconWrap} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
              <Ionicons name="earth-outline" size={28} color={brandColors.goldBright} />
            </View>
            <Body style={styles.stateTitle}>{emptyTitle}</Body>
            <Muted style={styles.stateMuted}>{t('lbEmptySubtitle')}</Muted>
            <Pressable style={styles.wallTap} onPress={() => router.push('/feed?tab=wall')} accessibilityRole="button">
              <Text style={styles.wallTapText}>{t('navWall')} →</Text>
            </Pressable>
          </View>
        ) : null}

        {!active.isLoading && !active.error && rows.length > 0 ? (
          <View style={styles.list}>
            {rows.map((row, i) => (
              <StatRow key={`${row.country_code}-${i}`} row={row} />
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
  statCard: {
    alignSelf: 'stretch',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: brandColors.pourCardStroke,
    backgroundColor: 'rgba(29, 24, 15, 0.72)',
    paddingVertical: 14,
    paddingHorizontal: 14,
    gap: 6,
  },
  statTitle: {
    fontWeight: '700',
    fontSize: 17,
  },
  statMeta: {
    fontSize: 13,
    lineHeight: 18,
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
