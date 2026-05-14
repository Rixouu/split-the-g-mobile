import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';

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
  const isPub = Boolean(barName);

  const locationIcon = isPub
    ? ('glass-mug-variant' as const)
    : geoLine
      ? ('map-marker-radius' as const)
      : ('map-marker-off-outline' as const);

  const locationRow = (
    <View style={styles.locationRow}>
      <View style={styles.locationIconWrap}>
        <MaterialCommunityIcons name={locationIcon} size={22} color="rgba(197, 160, 89, 0.82)" />
      </View>
      <View style={styles.locationCopy}>
        <Text style={styles.locationEyebrow}>{isPub ? t('pourVenueLabel') : t('pourLocationLabel')}</Text>

        {isPub ? (
          <>
            {canOpenPub ? (
              <Text style={styles.pubTitleLink} numberOfLines={2}>
                {barName}
              </Text>
            ) : (
              <Body style={styles.pubTitlePlain} numberOfLines={2}>
                {barName}
              </Body>
            )}
            {barAddress ? <Muted style={styles.address}>{barAddress}</Muted> : null}
            {canOpenPub ? <Muted style={styles.tapHint}>{t('pourPourSpotHint')}</Muted> : null}
          </>
        ) : geoLine ? (
          <Text style={styles.geoPrimary}>{geoLine}</Text>
        ) : (
          <Muted style={styles.emptyLocation}>{t('pourNoVenueSaved')}</Muted>
        )}
      </View>
      {canOpenPub ? (
        <Ionicons name="chevron-forward" size={18} color="rgba(197, 160, 89, 0.38)" style={styles.locationChevron} />
      ) : null}
    </View>
  );

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
            android_ripple={{ color: 'rgba(197, 160, 89, 0.14)' }}
            onPress={() => onPressPub!(pubPageBarKey!)}
            style={({ pressed }) => [styles.locationPressable, pressed && styles.locationPressed]}>
            {locationRow}
          </Pressable>
        ) : (
          locationRow
        )}

        {celebration ? (
          <View style={styles.verdictSlot} accessibilityRole="text">
            <View style={styles.verdictShell}>
              <View style={styles.verdictRibbon}>
                <Ionicons name="sparkles" size={15} color={brandColors.goldBright} />
                <Text style={styles.verdictRibbonText}>{t('pourCelebrationTitle')}</Text>
                <Ionicons name="sparkles" size={15} color={brandColors.goldBright} />
              </View>
              <View style={styles.quoteBackdrop}>
                <Text style={styles.quoteGhost} pointerEvents="none">
                  “
                </Text>
                <Text style={styles.celebrationSerif} accessibilityLabel={celebration}>
                  {celebration}
                </Text>
                <Text style={styles.quoteGhostEnd} pointerEvents="none">
                  ”
                </Text>
              </View>
            </View>
          </View>
        ) : null}
      </View>
    </CompetitionFormInset>
  );
}

const verdictShadow = Platform.select({
  ios: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.45,
    shadowRadius: 18,
  },
  android: { elevation: 12 },
  default: {},
});

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
  locationPressable: {
    marginHorizontal: -10,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  locationPressed: {
    backgroundColor: 'rgba(197, 160, 89, 0.06)',
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    paddingVertical: 6,
    paddingHorizontal: 0,
  },
  locationIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginTop: 2,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(197, 160, 89, 0.07)',
  },
  locationCopy: {
    flex: 1,
    minWidth: 0,
    gap: 5,
  },
  locationEyebrow: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.1,
    textTransform: 'uppercase',
    color: 'rgba(212, 183, 143, 0.48)',
  },
  locationChevron: {
    marginTop: 14,
    alignSelf: 'flex-start',
  },
  pubTitleLink: {
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: -0.2,
    color: brandColors.goldBright,
    textDecorationLine: 'underline',
    textDecorationColor: 'rgba(197, 160, 89, 0.35)',
    lineHeight: 23,
  },
  pubTitlePlain: {
    fontSize: 17,
    fontWeight: '600',
    lineHeight: 23,
  },
  geoPrimary: {
    fontSize: 17,
    fontWeight: '600',
    letterSpacing: -0.15,
    color: 'rgba(253, 251, 243, 0.88)',
    lineHeight: 23,
  },
  address: {
    fontSize: 13,
    lineHeight: 19,
    marginTop: -2,
  },
  tapHint: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 2,
    color: 'rgba(197, 160, 89, 0.78)',
  },
  emptyLocation: {
    fontSize: 14,
    lineHeight: 20,
    color: brandColors.tanMuted,
  },
  verdictSlot: {
    marginTop: 18,
  },
  verdictShell: {
    borderRadius: 20,
    paddingTop: 16,
    paddingBottom: 20,
    paddingHorizontal: 16,
    backgroundColor: 'rgba(14, 12, 10, 0.92)',
    borderWidth: 1,
    borderColor: 'rgba(197, 160, 89, 0.38)',
    ...verdictShadow,
  },
  verdictRibbon: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    marginBottom: 14,
  },
  verdictRibbonText: {
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 2.2,
    textTransform: 'uppercase',
    color: brandColors.gold,
  },
  quoteBackdrop: {
    position: 'relative',
    paddingHorizontal: 8,
    paddingVertical: 6,
    minHeight: 72,
    justifyContent: 'center',
  },
  quoteGhost: {
    position: 'absolute',
    left: -2,
    top: -8,
    fontSize: 64,
    lineHeight: 64,
    fontFamily: Platform.select({ ios: 'Georgia', android: 'serif', default: 'serif' }),
    color: 'rgba(197, 160, 89, 0.12)',
    fontWeight: '700',
  },
  quoteGhostEnd: {
    position: 'absolute',
    right: -2,
    bottom: -18,
    fontSize: 64,
    lineHeight: 64,
    fontFamily: Platform.select({ ios: 'Georgia', android: 'serif', default: 'serif' }),
    color: 'rgba(197, 160, 89, 0.1)',
    fontWeight: '700',
  },
  celebrationSerif: {
    fontFamily: Platform.select({ ios: 'Georgia', android: 'serif', default: 'serif' }),
    fontSize: 18,
    lineHeight: 27,
    fontStyle: 'italic',
    fontWeight: '500',
    color: 'rgba(253, 251, 243, 0.94)',
    textAlign: 'center',
    letterSpacing: 0.15,
  },
});
