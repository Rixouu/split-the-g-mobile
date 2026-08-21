import { Ionicons } from '@expo/vector-icons';
import { Link, Stack } from 'expo-router';
import { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Card, Screen, UNDER_STACK_HEADER_SAFE_AREA_EDGES } from '@/components/split-the-g/screen';
import { ScreenLoadingBlock } from '@/components/split-the-g/screen-loading';
import { Body, Muted } from '@/components/split-the-g/typography';
import { colors, radii, spacing } from '@/constants/design-tokens';
import { brandColors } from '@/constants/theme';
import { useMyScores } from '@/components/profile/hooks/use-my-scores';
import { useAuth } from '@/lib/auth/auth-context';
import { useLocale } from '@/lib/i18n/locale-context';
import { formatSplitScore } from '@/lib/pour/format-split-score';
import { computeProgressStats } from '@/lib/profile/compute-progress-stats';

const BORDER = brandColors.pourCardStroke;

function SplitScoreMeter({ score }: { score: number }) {
  const safe = typeof score === 'number' && Number.isFinite(score) ? score : 0;
  const pct = Math.min(100, Math.max(0, (safe / 5) * 100));
  return (
    <View style={meterStyles.track} accessibilityElementsHidden>
      <View style={[meterStyles.fill, { width: `${pct}%` }]} />
    </View>
  );
}

export default function ProfileScoresScreen() {
  const { user } = useAuth();
  const { t, tVars, locale } = useLocale();
  const scores = useMyScores();

  const list = useMemo(() => scores.data ?? [], [scores.data]);
  const hasScores = list.length > 0;

  const stats = useMemo(() => computeProgressStats(list), [list]);

  return (
    <Screen contentContainerStyle={styles.screenContent} edges={UNDER_STACK_HEADER_SAFE_AREA_EDGES}>
      <Stack.Screen options={{ title: t('profileNavScores') }} />

      {!user ? (
        <Card>
          <Body>{t('signInPrompt')}</Body>
        </Card>
      ) : null}

      {scores.isLoading ? <ScreenLoadingBlock /> : null}

      {scores.error ? (
        <Card>
          <Body>{scores.error.message}</Body>
        </Card>
      ) : null}

      {user && !scores.isLoading && !scores.error && !hasScores ? (
        <Card>
          <Muted style={styles.emptyBlurb}>{t('profileScoresEmptyBlurb')}</Muted>
        </Card>
      ) : null}

      {user && !scores.isLoading && !scores.error && hasScores ? (
        <>
          <Card style={styles.summaryCard}>
            <Muted style={styles.summaryHeading}>{t('profileProgressTitle')}</Muted>
            <View style={styles.statBand}>
              <View style={styles.statRow}>
                <View style={styles.statCell}>
                  <Text style={styles.statLabel}>{t('profileProgressStatPours')}</Text>
                  <Text style={styles.statValue} accessibilityRole="text">
                    {stats.count}
                  </Text>
                </View>
                <View style={styles.statCell}>
                  <Text style={styles.statLabel}>{t('profileProgressStatBest')}</Text>
                  <Text style={styles.statValue} accessibilityRole="text">
                    {formatSplitScore(stats.best)}
                  </Text>
                </View>
              </View>
              <View style={styles.statRow}>
                <View style={styles.statCell}>
                  <Text style={styles.statLabel}>{t('profileProgressStatAvg')}</Text>
                  <Text style={styles.statValue} accessibilityRole="text">
                    {formatSplitScore(stats.avg)}
                  </Text>
                </View>
                <View style={styles.statCell}>
                  <Text style={styles.statLabel}>{t('profileProgressStatLast7')}</Text>
                  <Text style={styles.statValue} accessibilityRole="text">
                    {stats.last7}
                  </Text>
                </View>
              </View>
            </View>
          </Card>

          <View style={styles.listSection}>
            <Text style={styles.listSectionTitle}>{t('profileScoresRecentTitle')}</Text>
            <View style={styles.list}>
              {list.map((s) => {
                const ref = s.slug || s.id;
                const price = s.pint_price;
                const showPaid = price != null && Number.isFinite(Number(price));
                const dateStr = s.created_at
                  ? new Date(s.created_at).toLocaleDateString(locale)
                  : '';
                return (
                  <Link key={s.id} href={`/pour/${encodeURIComponent(ref)}`} asChild>
                    <Pressable
                      style={({ pressed }) => [styles.pressableCard, pressed && styles.pressableCardPressed]}
                      accessibilityRole="link">
                      <View style={styles.cardColumn}>
                        <View style={styles.scoreRowTop}>
                          <Text style={styles.scoreValue} numberOfLines={1}>
                            {formatSplitScore(s.split_score)}
                          </Text>
                          <Muted style={styles.scoreDate} numberOfLines={1}>
                            {dateStr}
                          </Muted>
                        </View>
                        <SplitScoreMeter score={s.split_score} />
                        {(s.bar_name || showPaid) && (
                          <View style={styles.detailRow}>
                            <View style={styles.detailTexts}>
                              {s.bar_name ? (
                                <Text style={styles.barName} numberOfLines={2}>
                                  {s.bar_name}
                                </Text>
                              ) : null}
                              {showPaid ? (
                                <Muted style={styles.paidLine} numberOfLines={1}>
                                  {tVars('profileScoresPaid', {
                                    amount: Number(price).toLocaleString(locale, {
                                      minimumFractionDigits: 0,
                                      maximumFractionDigits: 2,
                                    }),
                                  })}
                                </Muted>
                              ) : null}
                            </View>
                            <View style={styles.affordanceRail} accessibilityElementsHidden>
                              <View style={styles.affordanceWell}>
                                <Ionicons
                                  name="chevron-forward"
                                  size={17}
                                  color={colors.cta.secondaryFg}
                                  style={styles.affordanceIcon}
                                />
                              </View>
                            </View>
                          </View>
                        )}
                      </View>
                    </Pressable>
                  </Link>
                );
              })}
            </View>
          </View>
        </>
      ) : null}
    </Screen>
  );
}

const meterStyles = StyleSheet.create({
  track: {
    width: '100%',
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.surface.hubIconWell,
    overflow: 'hidden',
    marginTop: spacing.sm,
  },
  fill: {
    height: '100%',
    borderRadius: 2,
    backgroundColor: colors.text.accentBright,
  },
});

const styles = StyleSheet.create({
  screenContent: {
    paddingTop: spacing.sm,
  },
  summaryCard: {
    gap: spacing.md,
    paddingVertical: spacing.lg,
  },
  summaryHeading: {
    textAlign: 'center',
    fontSize: 13,
    lineHeight: 19,
    color: colors.text.mutedStrong,
  },
  statBand: {
    gap: spacing.sm,
  },
  statRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  statCell: {
    flex: 1,
    minWidth: 0,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: radii.buttonRounded,
    backgroundColor: colors.surface.hubRow,
    paddingVertical: spacing.sm + 2,
    paddingHorizontal: spacing.sm,
    gap: spacing.xs,
  },
  statLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.text.mutedStrong,
    textAlign: 'center',
    lineHeight: 14,
  },
  statValue: {
    fontSize: 19,
    fontWeight: '700',
    color: colors.text.accentBright,
    fontVariant: ['tabular-nums'],
  },
  emptyBlurb: {
    textAlign: 'center',
    fontSize: 14,
    lineHeight: 21,
    color: colors.text.muted,
  },
  listSection: {
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: radii.lg + 2,
    backgroundColor: colors.surface.panelTranslucentSoft,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  listSectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.text.accentBright,
    letterSpacing: -0.2,
  },
  list: {
    marginTop: spacing.xs,
    gap: spacing.sm,
  },
  pressableCard: {
    width: '100%',
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: radii.buttonRounded,
    backgroundColor: colors.surface.inkTranslucent,
    paddingVertical: spacing.md - 2,
    paddingHorizontal: spacing.md,
  },
  pressableCardPressed: {
    borderColor: colors.stroke.ctaSecondary,
    backgroundColor: colors.surface.panelTranslucent,
  },
  cardColumn: {
    gap: spacing.xs,
    width: '100%',
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
    marginTop: spacing.sm,
    gap: spacing.md,
    width: '100%',
    minHeight: 40,
  },
  detailTexts: {
    flex: 1,
    minWidth: 0,
    justifyContent: 'center',
    gap: spacing.xs,
  },
  affordanceRail: {
    justifyContent: 'center',
    alignSelf: 'stretch',
    paddingLeft: spacing.xs,
  },
  affordanceWell: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.surface.hubIconWell,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.stroke.subtle,
    alignItems: 'center',
    justifyContent: 'center',
  },
  affordanceIcon: {
    opacity: 0.7,
    marginLeft: 1,
  },
  scoreRowTop: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  scoreValue: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.text.accentBright,
    fontVariant: ['tabular-nums'],
    includeFontPadding: false,
  },
  scoreDate: {
    flexShrink: 0,
    fontSize: 13,
    fontVariant: ['tabular-nums'],
  },
  barName: {
    fontSize: 15,
    lineHeight: 21,
    fontWeight: '600',
    color: colors.text.primary,
  },
  paidLine: {
    fontSize: 13,
    lineHeight: 18,
    color: colors.text.mutedMedium,
  },
});
