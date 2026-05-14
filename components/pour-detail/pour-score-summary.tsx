import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { CompetitionFormInset } from '@/components/competition/competition-form-layout';
import { Body, Muted } from '@/components/split-the-g/typography';
import { brandColors } from '@/constants/theme';
import type { PourRankContext, PourScore } from '@/lib/api/types';
import { useLocale } from '@/lib/i18n/locale-context';
import { formatSplitScore } from '@/lib/pour/format-split-score';

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
  const canOpenPub = Boolean(pubPageBarKey && onPressPub);

  function venueInner() {
    if (barName) {
      return (
        <>
          <Muted style={styles.sectionEyebrow}>{t('pourVenueLabel')}</Muted>
          {canOpenPub ? (
            <Body style={styles.truncate}>{barName}</Body>
          ) : (
            <Body style={styles.venueText}>{barName}</Body>
          )}
          {barAddress ? <Muted style={styles.address}>{barAddress}</Muted> : null}
        </>
      );
    }
    if (geoLine) {
      return (
        <>
          <Muted style={styles.sectionEyebrow}>{t('pourLocationLabel')}</Muted>
          <Body style={styles.venueText}>{geoLine}</Body>
        </>
      );
    }
    return <Muted style={styles.noVenueMuted}>{t('pourNoVenueSaved')}</Muted>;
  }

  return (
    <CompetitionFormInset>
      <View style={styles.inner}>
        <Text style={styles.displayName}>{displayName}</Text>

        <View style={styles.heroScore}>
          <Text style={styles.scoreBig}>{scoreStr}</Text>
          <Muted style={styles.outOf}>{t('pourOutOfFive')}</Muted>
        </View>

        {rank ? (
          <View style={styles.rankRow}>
            <View style={styles.statTile}>
              <Muted style={styles.statEyebrow}>{t('pourMetaAllTime')}</Muted>
              <Text style={styles.statValue}>
                #{rank.allTimeRank}
                <Text style={styles.statTotal}> / {rank.totalSplits}</Text>
              </Text>
            </View>
            <View style={styles.statTile}>
              <Muted style={styles.statEyebrow}>{t('pourMetaThisWeek')}</Muted>
              <Text style={styles.statValue}>
                #{rank.weeklyRank}
                <Text style={styles.statTotal}> / {rank.weeklyTotalSplits}</Text>
              </Text>
            </View>
          </View>
        ) : null}

        <View style={styles.fullDivider} />

        {canOpenPub ? (
          <Pressable
            accessibilityRole="link"
            android_ripple={{ color: 'rgba(197, 160, 89, 0.12)' }}
            onPress={() => onPressPub!(pubPageBarKey!)}
            style={({ pressed }) => [styles.venueTapRow, pressed && styles.rowPressed]}>
            <View style={styles.venueTapBody}>{venueInner()}</View>
            <Ionicons name="chevron-forward" size={20} color="rgba(197, 160, 89, 0.45)" />
          </Pressable>
        ) : (
          <View style={styles.venueBlock}>{venueInner()}</View>
        )}

        {celebration ? (
          <>
            <View style={styles.fullDivider} />
            <View style={styles.celebrationWrap}>
              <Text style={styles.celebration}>{celebration}</Text>
            </View>
          </>
        ) : null}
      </View>
    </CompetitionFormInset>
  );
}

const styles = StyleSheet.create({
  inner: {
    paddingHorizontal: 18,
    paddingTop: 20,
    paddingBottom: 20,
    gap: 0,
  },
  displayName: {
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: -0.35,
    color: brandColors.goldBright,
    textAlign: 'center',
    marginBottom: 12,
  },
  heroScore: {
    alignItems: 'center',
    marginBottom: 16,
  },
  scoreBig: {
    fontSize: 56,
    fontWeight: '800',
    color: brandColors.gold,
    letterSpacing: -2,
    lineHeight: 60,
    fontVariant: ['tabular-nums'],
  },
  outOf: {
    marginTop: 4,
    fontSize: 14,
    textAlign: 'center',
    color: 'rgba(212, 183, 143, 0.62)',
  },
  rankRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 4,
    width: '100%',
    justifyContent: 'center',
  },
  statTile: {
    flex: 1,
    maxWidth: 200,
    backgroundColor: 'rgba(11, 11, 11, 0.38)',
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: brandColors.borderSubtle,
    paddingVertical: 12,
    paddingHorizontal: 8,
    alignItems: 'center',
    gap: 6,
  },
  statEyebrow: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.9,
    textTransform: 'uppercase',
    textAlign: 'center',
    color: 'rgba(212, 183, 143, 0.55)',
  },
  statValue: {
    fontSize: 17,
    fontWeight: '800',
    color: brandColors.goldBright,
    fontVariant: ['tabular-nums'],
    textAlign: 'center',
  },
  statTotal: {
    fontWeight: '500',
    color: 'rgba(212, 183, 143, 0.65)',
    fontVariant: ['tabular-nums'],
  },
  fullDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: brandColors.borderSubtle,
    marginVertical: 16,
    alignSelf: 'stretch',
    marginHorizontal: -4,
  },
  venueTapRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginHorizontal: -8,
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 12,
  },
  rowPressed: { backgroundColor: 'rgba(29, 24, 15, 0.65)' },
  venueTapBody: { flex: 1, minWidth: 0, gap: 6 },
  venueBlock: {
    gap: 6,
  },
  sectionEyebrow: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.75,
    textTransform: 'uppercase',
    color: 'rgba(197, 160, 89, 0.78)',
  },
  venueText: {
    fontSize: 16,
    fontWeight: '600',
    color: brandColors.cream,
    lineHeight: 22,
  },
  truncate: {
    fontSize: 17,
    fontWeight: '700',
    color: brandColors.gold,
    textDecorationLine: 'underline',
    textDecorationColor: 'rgba(179, 139, 45, 0.42)',
    lineHeight: 23,
  },
  address: {
    fontSize: 13,
    lineHeight: 19,
    marginTop: 2,
  },
  noVenueMuted: {
    textAlign: 'center',
    fontSize: 14,
    lineHeight: 20,
    color: brandColors.tanMuted,
  },
  celebrationWrap: {
    borderLeftWidth: 3,
    borderLeftColor: brandColors.gold,
    paddingLeft: 14,
    paddingVertical: 2,
    marginRight: 4,
    backgroundColor: 'rgba(179, 139, 45, 0.06)',
    borderRadius: 4,
  },
  celebration: {
    fontSize: 15,
    lineHeight: 22,
    fontStyle: 'italic',
    fontWeight: '500',
    color: brandColors.goldBright,
  },
});
