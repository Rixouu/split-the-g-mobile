import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Body, Muted } from '@/components/split-the-g/typography';
import { brandColors } from '@/constants/theme';
import type { PourRankContext, PourScore } from '@/lib/api/types';
import { useLocale } from '@/lib/i18n/locale-context';
import { formatSplitScore } from '@/lib/pour/format-split-score';

const stroke = brandColors.pourCardStroke;

interface PourScoreSummaryProps {
  score: PourScore;
  rank: PourRankContext | null;
  celebration: string;
  pubPageBarKey: string | null;
  onPressPub?: (barKey: string) => void;
}

export function PourScoreSummary({
  score,
  rank,
  celebration,
  pubPageBarKey,
  onPressPub,
}: PourScoreSummaryProps) {
  const { t } = useLocale();
  const displayName = score.username?.trim() || t('pourAnonymousDisplay');
  const scoreStr = formatSplitScore(score.split_score ?? null);
  const geoLine = [score.city, score.region, score.country].filter(Boolean).join(', ');
  const barName = score.bar_name?.trim() ?? '';
  const barAddress = score.bar_address?.trim() ?? '';

  return (
    <View style={styles.card}>
      <Text style={styles.displayName}>{displayName}</Text>

      <View style={styles.scoreBlock}>
        <View style={styles.scoreMain}>
          <Text style={styles.scoreBig}>{scoreStr}</Text>
          <Muted style={styles.outOf}>{t('pourOutOfFive')}</Muted>
        </View>

        {rank ? (
          <View style={styles.rankGrid}>
            <View style={styles.rankCell}>
              <Muted style={styles.rankMeta}>{t('pourMetaAllTime')}</Muted>
              <Text style={styles.rankValue}>
                #{rank.allTimeRank}
                <Text style={styles.rankTotal}> / {rank.totalSplits}</Text>
              </Text>
            </View>
            <View style={styles.rankCell}>
              <Muted style={styles.rankMeta}>{t('pourMetaThisWeek')}</Muted>
              <Text style={styles.rankValue}>
                #{rank.weeklyRank}
                <Text style={styles.rankTotal}> / {rank.weeklyTotalSplits}</Text>
              </Text>
            </View>
          </View>
        ) : null}
      </View>

      <View style={styles.divider} />

      <View style={styles.venueBlock}>
        {barName ? (
          <>
            <Muted style={styles.sectionLabel}>{t('pourVenueLabel')}</Muted>
            {pubPageBarKey && onPressPub ? (
              <Pressable onPress={() => onPressPub(pubPageBarKey)} accessibilityRole="link">
                <Text style={styles.venueLink}>{barName}</Text>
              </Pressable>
            ) : (
              <Body style={styles.venueText}>{barName}</Body>
            )}
            {barAddress ? <Muted style={styles.address}>{barAddress}</Muted> : null}
          </>
        ) : geoLine ? (
          <>
            <Muted style={styles.sectionLabel}>{t('pourLocationLabel')}</Muted>
            <Body style={styles.venueText}>{geoLine}</Body>
          </>
        ) : (
          <Muted style={styles.mutedCenter}>{t('pourNoVenueSaved')}</Muted>
        )}
      </View>

      {celebration ? (
        <>
          <View style={styles.divider} />
          <Text style={styles.celebration}>{celebration}</Text>
        </>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderColor: stroke,
    borderRadius: 16,
    backgroundColor: 'rgba(29, 24, 15, 0.3)',
    paddingHorizontal: 20,
    paddingVertical: 22,
    gap: 0,
  },
  displayName: {
    textAlign: 'center',
    fontSize: 18,
    fontWeight: '700',
    color: brandColors.goldBright,
    marginBottom: 18,
  },
  scoreBlock: {
    flexDirection: 'column',
    gap: 18,
    alignItems: 'center',
  },
  scoreMain: {
    alignItems: 'center',
  },
  scoreBig: {
    fontSize: 52,
    fontWeight: '800',
    color: brandColors.gold,
    letterSpacing: -1.2,
    lineHeight: 56,
    fontVariant: ['tabular-nums'],
  },
  outOf: {
    marginTop: 6,
    fontSize: 14,
    textAlign: 'center',
  },
  rankGrid: {
    flexDirection: 'row',
    width: '100%',
    maxWidth: 320,
    gap: 16,
    justifyContent: 'space-between',
  },
  rankCell: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  rankMeta: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  rankValue: {
    fontSize: 16,
    fontWeight: '800',
    color: brandColors.goldBright,
    fontVariant: ['tabular-nums'],
  },
  rankTotal: {
    fontWeight: '500',
    color: 'rgba(212, 183, 143, 0.65)',
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: stroke,
    marginVertical: 18,
  },
  venueBlock: {
    gap: 8,
  },
  sectionLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  venueLink: {
    fontSize: 17,
    fontWeight: '600',
    color: brandColors.gold,
    textDecorationLine: 'underline',
    textDecorationColor: 'rgba(179, 139, 45, 0.45)',
  },
  venueText: {
    fontSize: 16,
    fontWeight: '600',
  },
  address: {
    fontSize: 13,
    lineHeight: 19,
    marginTop: 2,
  },
  mutedCenter: {
    textAlign: 'center',
    fontSize: 14,
  },
  celebration: {
    textAlign: 'center',
    fontSize: 16,
    lineHeight: 24,
    fontStyle: 'italic',
    color: brandColors.gold,
    paddingHorizontal: 4,
  },
});
