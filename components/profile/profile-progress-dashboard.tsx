import { useMemo, useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import Svg, { Circle } from 'react-native-svg';

import { AppButton } from '@/components/split-the-g/button';
import { brandColors } from '@/constants/theme';
import type { MyScoreRow } from '@/lib/api/profile';
import { computeProgressStats } from '@/lib/profile/compute-progress-stats';
import {
  buildFriendLeaderboard,
  pourStreakCalendarDays,
  progressRangeStart,
  weeklyStreakFromScores,
  weekendStreakFromScores,
  type ComparisonScoreRow,
  type ProgressRange,
} from '@/lib/profile/profile-leaderboard';
import type { TranslationKey } from '@/lib/i18n/translations';
import { useLocale } from '@/lib/i18n/locale-context';
import { normalizeEmail } from '@/lib/utils/profile-email';
import { useRouter } from 'expo-router';

const BORDER = '#322914';
const CARD_BG = 'rgba(29, 24, 15, 0.35)';
const INSET_BG = 'rgba(11, 11, 11, 0.6)';

interface ProfileProgressDashboardProps {
  scores: MyScoreRow[];
  comparisonScores: ComparisonScoreRow[];
  comparisonLabels: Record<string, string>;
  userEmail: string | null;
  streakSnapshot: { daily: number; weekly: number; weekend: number } | null;
}

function ProgressDial({ dialPct, centerTitle, centerValue }: { dialPct: number; centerTitle: string; centerValue: string }) {
  const size = 168;
  const stroke = 16;
  const r = (size - stroke) / 2;
  const cx = size / 2;
  const cy = size / 2;
  const circumference = 2 * Math.PI * r;
  const dashGold = (dialPct / 100) * circumference;

  return (
    <View style={dialStyles.wrap}>
      <Svg width={size} height={size} style={dialStyles.svg}>
        <Circle cx={cx} cy={cy} r={r} stroke="rgba(55,44,22,0.5)" strokeWidth={stroke} fill="none" />
        <Circle
          cx={cx}
          cy={cy}
          r={r}
          stroke="rgba(213,178,99,0.98)"
          strokeWidth={stroke}
          fill="none"
          strokeDasharray={`${dashGold} ${circumference}`}
          strokeLinecap="round"
          rotation={-90}
          origin={`${cx}, ${cy}`}
        />
      </Svg>
      <View style={dialStyles.inner}>
        <Text style={dialStyles.innerMeta}>{centerTitle}</Text>
        <Text style={dialStyles.innerValue}>{centerValue}</Text>
      </View>
    </View>
  );
}

function LinearBar({
  pct,
  trackClass,
}: {
  pct: number;
  trackClass: 'gold' | 'frame' | 'tan';
}) {
  const widthPct = Math.max(8, Math.min(100, pct));
  const fill =
    trackClass === 'gold'
      ? 'rgba(213,178,99,0.95)'
      : trackClass === 'tan'
        ? 'rgba(212, 183, 143, 0.85)'
        : 'rgba(50, 41, 20, 0.95)';
  return (
    <View style={barStyles.track}>
      <View style={[barStyles.fill, { width: `${widthPct}%`, backgroundColor: fill }]} />
    </View>
  );
}

export function ProfileProgressDashboard({
  scores,
  comparisonScores,
  comparisonLabels,
  userEmail,
  streakSnapshot,
}: ProfileProgressDashboardProps) {
  const { t, tVars } = useLocale();
  const router = useRouter();
  const { width } = useWindowDimensions();
  const [progressRange, setProgressRange] = useState<ProgressRange>('30d');
  const [insightsOpen, setInsightsOpen] = useState(false);

  const progressStats = useMemo(() => computeProgressStats(scores), [scores]);

  const comparisonWindowStart = useMemo(() => progressRangeStart(progressRange), [progressRange]);

  const filteredComparisonScores = useMemo(() => {
    if (comparisonWindowStart == null) return comparisonScores;
    return comparisonScores.filter((row) => new Date(row.created_at).getTime() >= comparisonWindowStart);
  }, [comparisonScores, comparisonWindowStart]);

  const friendLeaderboard = useMemo(
    () =>
      buildFriendLeaderboard(
        filteredComparisonScores,
        comparisonLabels,
        userEmail ? normalizeEmail(userEmail) : null,
      ),
    [comparisonLabels, filteredComparisonScores, userEmail],
  );

  const mostVisitedPubEntry = useMemo(() => {
    const counter = new Map<string, number>();
    for (const s of scores) {
      const key = s.bar_name?.trim();
      if (!key) continue;
      counter.set(key, (counter.get(key) ?? 0) + 1);
    }
    let bestName = '';
    let bestCount = 0;
    for (const [name, count] of counter.entries()) {
      if (count > bestCount) {
        bestName = name;
        bestCount = count;
      }
    }
    return bestName ? { name: bestName, count: bestCount } : null;
  }, [scores]);

  const weekendStreak = useMemo(() => weekendStreakFromScores(scores), [scores]);
  const streakDaily = streakSnapshot?.daily ?? pourStreakCalendarDays(scores);
  const streakWeekly = streakSnapshot?.weekly ?? weeklyStreakFromScores(scores);
  const streakWeekend = streakSnapshot?.weekend ?? weekendStreak;

  const scoreBuckets = useMemo(
    () =>
      [
        { key: '0-2', min: 0, max: 2 },
        { key: '2-3', min: 2, max: 3 },
        { key: '3-4', min: 3, max: 4 },
        { key: '4-5', min: 4, max: 5.01 },
      ].map((bucket) => ({
        ...bucket,
        count: scores.filter((s) => s.split_score >= bucket.min && s.split_score < bucket.max).length,
      })),
    [scores],
  );

  const maxBucket = Math.max(1, ...scoreBuckets.map((b) => b.count));
  const strongestBucket = scoreBuckets.reduce((best, current) => (current.count > best.count ? current : best));

  const recentScores = useMemo(
    () =>
      [...scores].sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
      ).slice(0, 4),
    [scores],
  );

  const latestScore = recentScores[0]?.split_score ?? null;
  const previousScore = recentScores[1]?.split_score ?? null;
  const scoreDelta =
    latestScore != null && previousScore != null ? latestScore - previousScore : null;

  const consistencyStdDev = useMemo(() => {
    if (scores.length < 2) return null;
    const mean = scores.reduce((sum, s) => sum + s.split_score, 0) / scores.length;
    const variance =
      scores.reduce((sum, s) => sum + (s.split_score - mean) ** 2, 0) / scores.length;
    return Math.sqrt(variance);
  }, [scores]);

  const totalPints = scores.length;
  const gridItemMin = (width - 40 - 12) / 2;

  const rangeTabs: { value: ProgressRange; labelKey: TranslationKey }[] = [
    { value: '7d', labelKey: 'profileProgressTab7d' },
    { value: '30d', labelKey: 'profileProgressTab30d' },
    { value: '90d', labelKey: 'profileProgressTab90d' },
    { value: 'all', labelKey: 'profileProgressTabAll' },
  ];

  const statTiles: { labelKey: TranslationKey; value: string }[] = [
    { labelKey: 'profileProgressStatPours', value: String(progressStats.count) },
    { labelKey: 'profileProgressStatBest', value: progressStats.best.toFixed(2) },
    { labelKey: 'profileProgressStatAvg', value: progressStats.avg.toFixed(2) },
    { labelKey: 'profileProgressStatLast7', value: String(progressStats.last7) },
  ];

  return (
    <View style={styles.root}>
      <View style={styles.statGrid}>
        {statTiles.map((item) => (
          <View key={item.labelKey} style={[styles.statTile, { width: gridItemMin }]}>
            <Text style={styles.statTileLabel}>{t(item.labelKey)}</Text>
            <Text style={styles.statTileValue}>{item.value}</Text>
          </View>
        ))}
      </View>

      <View style={styles.sectionCard}>
        <View style={styles.dialRow}>
          <View style={styles.dialCol}>
            <ProgressDial
              dialPct={progressStats.dialPct}
              centerTitle={t('profileProgressAverage')}
              centerValue={progressStats.avg.toFixed(2)}
            />
            <Text style={styles.last7Meta}>
              {t('profileProgressLast7Pour')}{' '}
              <Text style={styles.last7Strong}>{progressStats.last7}</Text> {t('profileProgressPoursSuffix')}
            </Text>
          </View>
          <View style={styles.barsCol}>
            <View style={styles.barBlock}>
              <View style={styles.barHeader}>
                <Text style={styles.barLabel}>{t('profileProgressAverage')}</Text>
                <Text style={styles.barMeta}>
                  {progressStats.avg.toFixed(2)}
                  {t('profileProgressOutOfFiveMax')}
                </Text>
              </View>
              <LinearBar pct={(progressStats.avg / 5) * 100} trackClass="gold" />
            </View>
            <View style={styles.barBlock}>
              <View style={styles.barHeader}>
                <Text style={styles.barLabel}>{t('profileProgressStatBest')}</Text>
                <Text style={styles.barMeta}>
                  {progressStats.best.toFixed(2)}
                  {t('profileProgressOutOfFiveMax')}
                </Text>
              </View>
              <LinearBar pct={(progressStats.best / 5) * 100} trackClass="frame" />
            </View>
            <View style={styles.barBlock}>
              <View style={styles.barHeader}>
                <Text style={styles.barLabel}>{t('profileProgressRecentVolume')}</Text>
                <Text style={styles.barMeta}>
                  {Math.min(progressStats.last7, 5).toFixed(2)}
                  {tVars('profileProgressVolume7dSuffix', { count: String(progressStats.last7) })}
                </Text>
              </View>
              <LinearBar pct={(Math.min(progressStats.last7, 5) / 5) * 100} trackClass="tan" />
            </View>
          </View>
        </View>
      </View>

      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>{t('profileProgressAnalyticsTitle')}</Text>
        <View style={styles.detailGrid}>
          <View style={[styles.detailTile, { minWidth: gridItemMin }]}>
            <Text style={styles.detailMeta}>{t('profileProgressAnalyticsAvgScore')}</Text>
            <Text style={styles.detailValue}>{progressStats.avg.toFixed(2)}</Text>
          </View>
          <View style={[styles.detailTile, { minWidth: gridItemMin }]}>
            <Text style={styles.detailMeta}>{t('profileProgressAnalyticsTotalPints')}</Text>
            <Text style={styles.detailValue}>{totalPints}</Text>
          </View>
          <View style={[styles.detailTile, { minWidth: gridItemMin }]}>
            <Text style={styles.detailMeta}>{t('profileProgressAnalyticsMostPub')}</Text>
            <Text style={styles.detailBody} numberOfLines={3}>
              {mostVisitedPubEntry
                ? `${mostVisitedPubEntry.name} (${mostVisitedPubEntry.count})`
                : t('profileProgressAnalyticsNoData')}
            </Text>
          </View>
          <View style={[styles.detailTile, { minWidth: gridItemMin }]}>
            <Text style={styles.detailMeta}>{t('profileProgressAnalyticsStreaks')}</Text>
            <Text style={styles.detailBody}>
              {tVars('profileProgressAnalyticsStreakValues', {
                day: String(streakDaily),
                week: String(streakWeekly),
                weekend: String(streakWeekend),
              })}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.sectionCard}>
        <View style={styles.scoreHistoryHeader}>
          <Text style={styles.sectionTitle}>{t('profileProgressScoreHistoryTitle')}</Text>
          <Pressable
            onPress={() => setInsightsOpen(true)}
            accessibilityRole="button"
            accessibilityLabel={t('profileProgressScoreInsightsAria')}
            style={({ pressed }) => [styles.helpBtn, pressed && styles.helpBtnPressed]}>
            <Text style={styles.helpBtnText}>?</Text>
          </Pressable>
        </View>
        <Text style={styles.sectionBlurb}>{t('profileProgressScoreHistoryBlurb')}</Text>

        <View style={styles.historyGrid}>
          <View style={styles.historyCol}>
            <Text style={styles.historyColTitle}>{t('profileProgressScoreHistoryTitle')}</Text>
            {recentScores.length > 0 ? (
              recentScores.map((score) => (
                <View key={score.id} style={styles.historyRow}>
                  <Text style={styles.historyDate}>
                    {new Date(score.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                  </Text>
                  <Text style={styles.historyScore}>{score.split_score.toFixed(2)}</Text>
                </View>
              ))
            ) : (
              <Text style={styles.historyEmpty}>{t('profileProgressAnalyticsNoData')}</Text>
            )}
          </View>
          <View style={styles.historyCol}>
            <Text style={styles.historyColTitle}>{t('profileProgressAnalyticsTitle')}</Text>
            <View style={styles.miniStat}>
              <Text style={styles.miniStatLabel}>{t('profileProgressStatBest')}</Text>
              <Text style={styles.miniStatValue}>{progressStats.best.toFixed(2)}</Text>
            </View>
            <View style={styles.miniStat}>
              <Text style={styles.miniStatLabel}>{t('profileProgressMomentum')}</Text>
              <Text style={styles.miniStatValue}>
                {scoreDelta == null ? 'n/a' : `${scoreDelta >= 0 ? '+' : ''}${scoreDelta.toFixed(2)}`}
              </Text>
            </View>
            <View style={styles.miniStat}>
              <Text style={styles.miniStatLabel}>{t('profileProgressConsistency')}</Text>
              <Text style={styles.miniStatValue}>
                {consistencyStdDev == null ? 'n/a' : `σ ${consistencyStdDev.toFixed(2)}`}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.distCard}>
          <Text style={styles.historyColTitle}>{t('profileProgressScoreDistributionTitle')}</Text>
          <View style={{ marginTop: 10, gap: 8 }}>
            {scoreBuckets.map((bucket) => (
              <View key={bucket.key} style={styles.distRow}>
                <Text style={styles.distKey}>{bucket.key}</Text>
                <View style={styles.distBarTrack}>
                  <View
                    style={[
                      styles.distBarFill,
                      { width: `${Math.max(4, (bucket.count / maxBucket) * 100)}%` },
                    ]}
                  />
                </View>
                <Text style={styles.distPct}>
                  {bucket.count} ({Math.round((bucket.count / totalPints) * 100)}%)
                </Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.bandCard}>
          <View style={styles.bandHeader}>
            <Text style={styles.historyColTitle}>{t('profileProgressTopBandLabel')}</Text>
            <Text style={styles.bandKey}>{strongestBucket.key}</Text>
          </View>
          <Text style={styles.bandFooter}>
            {tVars('profileProgressTopBandFooter', {
              inBand: String(strongestBucket.count),
              total: String(totalPints),
            })}
          </Text>
        </View>
      </View>

      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>{t('profileProgressFriendLbTitle')}</Text>
        <Text style={styles.sectionBlurb}>{t('profileProgressFriendLbBlurb')}</Text>
        <View style={styles.tabsRow}>
          {rangeTabs.map((tab) => {
            const active = progressRange === tab.value;
            return (
              <Pressable
                key={tab.value}
                onPress={() => setProgressRange(tab.value)}
                style={[styles.tab, active && styles.tabActive]}
                accessibilityState={{ selected: active }}>
                <Text style={[styles.tabLabel, active && styles.tabLabelActive]}>{t(tab.labelKey)}</Text>
              </Pressable>
            );
          })}
        </View>
        {friendLeaderboard.length > 0 ? (
          <View style={{ marginTop: 16, gap: 10 }}>
            {friendLeaderboard.slice(0, 8).map((entry, index) => (
              <View
                key={entry.email}
                style={[styles.lbRow, entry.isCurrentUser && styles.lbRowYou]}>
                <Text style={styles.lbRank}>#{index + 1}</Text>
                <View style={styles.lbMid}>
                  <Text style={styles.lbName} numberOfLines={1}>
                    {entry.label}
                    {entry.isCurrentUser ? t('profileProgressYouSuffix') : ''}
                  </Text>
                  <Text style={styles.lbEmail} numberOfLines={1}>
                    {entry.email}
                  </Text>
                </View>
                <Text style={styles.lbPours}>
                  {tVars('profileProgressLbPours', { count: String(entry.pours) })}
                </Text>
              </View>
            ))}
          </View>
        ) : (
          <Text style={[styles.sectionBlurb, { marginTop: 16 }]}>{t('profileProgressEmptyLb')}</Text>
        )}
      </View>

      <AppButton label={t('actionBack')} variant="outlineGold" onPress={() => router.back()} />

      <Modal
        visible={insightsOpen}
        animationType="fade"
        transparent
        onRequestClose={() => setInsightsOpen(false)}>
        <View style={styles.modalRoot}>
          <Pressable style={styles.modalBackdropFill} onPress={() => setInsightsOpen(false)} />
          <View style={styles.modalPanel}>
            <View style={styles.modalHeader}>
              <View style={{ flex: 1 }}>
                <Text style={styles.modalTitle}>{t('profileProgressInsightsTitle')}</Text>
                <Text style={styles.modalBlurb}>{t('profileProgressInsightsBlurb')}</Text>
              </View>
              <Pressable onPress={() => setInsightsOpen(false)} style={styles.modalClose} accessibilityRole="button">
                <Text style={styles.modalCloseText}>×</Text>
              </Pressable>
            </View>
            <ScrollView style={styles.modalScroll} showsVerticalScrollIndicator={false}>
              {(
                [
                  ['profileProgressInsightsHistoryTitle', 'profileProgressInsightsHistoryBody'],
                  ['profileProgressInsightsMomentumTitle', 'profileProgressInsightsMomentumBody'],
                  ['profileProgressInsightsConsistencyTitle', 'profileProgressInsightsConsistencyBody'],
                  ['profileProgressInsightsDistributionTitle', 'profileProgressInsightsDistributionBody'],
                  ['profileProgressInsightsBandTitle', 'profileProgressInsightsBandBody'],
                ] as const
              ).map(([titleKey, bodyKey]) => (
                <View key={`${titleKey}-${bodyKey}`} style={styles.insightArticle}>
                  <Text style={styles.insightTitle}>{t(titleKey)}</Text>
                  <Text style={styles.insightBody}>{t(bodyKey)}</Text>
                </View>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const dialStyles = StyleSheet.create({
  wrap: {
    width: 168,
    height: 168,
    alignItems: 'center',
    justifyContent: 'center',
  },
  svg: { position: 'absolute' },
  inner: {
    width: 104,
    height: 104,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: BORDER,
    backgroundColor: 'rgba(11,11,11,0.95)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  innerMeta: {
    fontSize: 11,
    fontWeight: '600',
    color: 'rgba(212, 183, 143, 0.72)',
    textAlign: 'center',
  },
  innerValue: {
    marginTop: 2,
    fontSize: 26,
    fontWeight: '800',
    color: brandColors.goldBright,
    fontVariant: ['tabular-nums'],
  },
});

const barStyles = StyleSheet.create({
  track: {
    height: 12,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(50, 41, 20, 0.8)',
    backgroundColor: INSET_BG,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: 999,
  },
});

const styles = StyleSheet.create({
  root: { gap: 18 },
  statGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'space-between',
  },
  statTile: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: BORDER,
    backgroundColor: 'rgba(29, 24, 15, 0.35)',
    paddingVertical: 14,
    paddingHorizontal: 10,
    alignItems: 'center',
  },
  statTileLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: 'rgba(212, 183, 143, 0.7)',
    textAlign: 'center',
  },
  statTileValue: {
    marginTop: 6,
    fontSize: 28,
    fontWeight: '800',
    color: brandColors.goldBright,
    fontVariant: ['tabular-nums'],
  },
  sectionCard: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: BORDER,
    backgroundColor: CARD_BG,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: brandColors.cream,
    letterSpacing: -0.2,
  },
  sectionBlurb: {
    marginTop: 6,
    fontSize: 13,
    lineHeight: 19,
    color: 'rgba(212, 183, 143, 0.72)',
  },
  dialRow: {
    flexDirection: 'column',
    gap: 20,
  },
  dialCol: {
    alignItems: 'center',
    gap: 10,
  },
  last7Meta: {
    fontSize: 12,
    textAlign: 'center',
    color: 'rgba(212, 183, 143, 0.78)',
    maxWidth: 200,
  },
  last7Strong: {
    fontWeight: '800',
    color: brandColors.cream,
  },
  barsCol: { gap: 14 },
  barBlock: { gap: 6 },
  barHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
  },
  barLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: brandColors.cream,
    flexShrink: 1,
  },
  barMeta: {
    fontSize: 12,
    fontWeight: '600',
    color: 'rgba(212, 183, 143, 0.72)',
    fontVariant: ['tabular-nums'],
  },
  detailGrid: {
    marginTop: 14,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  detailTile: {
    flexGrow: 1,
    flexBasis: '45%',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: BORDER,
    backgroundColor: 'rgba(11, 11, 11, 0.35)',
    padding: 14,
  },
  detailMeta: {
    fontSize: 12,
    fontWeight: '600',
    color: 'rgba(212, 183, 143, 0.7)',
  },
  detailValue: {
    marginTop: 6,
    fontSize: 22,
    fontWeight: '800',
    color: brandColors.goldBright,
    fontVariant: ['tabular-nums'],
  },
  detailBody: {
    marginTop: 6,
    fontSize: 13,
    fontWeight: '600',
    color: brandColors.cream,
    lineHeight: 18,
  },
  scoreHistoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  helpBtn: {
    width: 36,
    height: 36,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(179, 139, 45, 0.28)',
    backgroundColor: 'rgba(11, 11, 11, 0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  helpBtnPressed: { opacity: 0.85 },
  helpBtnText: {
    fontSize: 16,
    fontWeight: '800',
    color: brandColors.gold,
  },
  historyGrid: {
    marginTop: 14,
    flexDirection: 'row',
    gap: 10,
  },
  historyCol: {
    flex: 1,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: BORDER,
    backgroundColor: 'rgba(11, 11, 11, 0.35)',
    padding: 10,
    gap: 8,
  },
  historyColTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: 'rgba(212, 183, 143, 0.68)',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  historyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: BORDER,
    backgroundColor: 'rgba(11, 11, 11, 0.4)',
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  historyDate: { fontSize: 11, color: 'rgba(212, 183, 143, 0.78)' },
  historyScore: {
    fontSize: 14,
    fontWeight: '700',
    color: brandColors.goldBright,
    fontVariant: ['tabular-nums'],
  },
  historyEmpty: { fontSize: 12, color: 'rgba(212, 183, 143, 0.72)' },
  miniStat: {
    borderRadius: 10,
    borderWidth: 1,
    borderColor: BORDER,
    backgroundColor: 'rgba(11, 11, 11, 0.4)',
    paddingHorizontal: 8,
    paddingVertical: 8,
    gap: 2,
  },
  miniStatLabel: { fontSize: 11, color: 'rgba(212, 183, 143, 0.72)' },
  miniStatValue: {
    fontSize: 14,
    fontWeight: '700',
    color: brandColors.cream,
    fontVariant: ['tabular-nums'],
  },
  distCard: {
    marginTop: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: BORDER,
    backgroundColor: 'rgba(11, 11, 11, 0.35)',
    padding: 12,
  },
  distRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  distKey: { width: 36, fontSize: 12, color: 'rgba(212, 183, 143, 0.82)', fontVariant: ['tabular-nums'] },
  distBarTrack: {
    flex: 1,
    height: 12,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: BORDER,
    backgroundColor: 'rgba(11, 11, 11, 0.5)',
    overflow: 'hidden',
  },
  distBarFill: {
    height: '100%',
    borderRadius: 999,
    backgroundColor: 'rgba(213, 178, 99, 0.95)',
  },
  distPct: { width: 72, fontSize: 11, color: 'rgba(212, 183, 143, 0.82)', fontVariant: ['tabular-nums'] },
  bandCard: {
    marginTop: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: BORDER,
    backgroundColor: 'rgba(11, 11, 11, 0.35)',
    padding: 12,
  },
  bandHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  bandKey: { fontSize: 14, fontWeight: '800', color: brandColors.goldBright },
  bandFooter: { marginTop: 6, fontSize: 12, color: 'rgba(212, 183, 143, 0.75)', lineHeight: 17 },
  tabsRow: {
    marginTop: 14,
    flexDirection: 'row',
    borderRadius: 12,
    gap: 6,
    padding: 4,
    backgroundColor: 'rgba(11, 11, 11, 0.45)',
  },
  tab: {
    flex: 1,
    minHeight: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  tabActive: {
    backgroundColor: brandColors.gold,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
  },
  tabLabel: {
    fontSize: 13,
    fontWeight: '800',
    color: 'rgba(212, 183, 143, 0.78)',
  },
  tabLabelActive: { color: brandColors.black },
  lbRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: BORDER,
    backgroundColor: 'rgba(11, 11, 11, 0.3)',
    paddingVertical: 12,
    paddingHorizontal: 12,
  },
  lbRowYou: {
    borderColor: 'rgba(179, 139, 45, 0.38)',
    backgroundColor: 'rgba(179, 139, 45, 0.1)',
  },
  lbRank: { fontSize: 14, fontWeight: '800', color: brandColors.goldBright, width: 36 },
  lbMid: { flex: 1, minWidth: 0 },
  lbName: { fontSize: 15, fontWeight: '700', color: brandColors.cream },
  lbEmail: { fontSize: 12, color: 'rgba(212, 183, 143, 0.58)', marginTop: 2 },
  lbPours: { fontSize: 13, color: 'rgba(212, 183, 143, 0.82)', fontVariant: ['tabular-nums'] },
  modalRoot: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalBackdropFill: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(11, 11, 11, 0.78)',
  },
  modalPanel: {
    marginHorizontal: 16,
    marginBottom: 24,
    maxHeight: '78%',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(179, 139, 45, 0.28)',
    backgroundColor: brandColors.black,
    padding: 16,
  },
  modalHeader: { flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
  modalTitle: { fontSize: 18, fontWeight: '800', color: brandColors.cream },
  modalBlurb: { marginTop: 4, fontSize: 12, color: 'rgba(212, 183, 143, 0.75)', lineHeight: 17 },
  modalClose: {
    width: 36,
    height: 36,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(179, 139, 45, 0.28)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCloseText: { fontSize: 22, color: brandColors.gold, fontWeight: '600', lineHeight: 24 },
  modalScroll: { marginTop: 12, maxHeight: 420 },
  insightArticle: {
    marginBottom: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: BORDER,
    backgroundColor: 'rgba(11, 11, 11, 0.4)',
    padding: 12,
  },
  insightTitle: { fontSize: 14, fontWeight: '700', color: brandColors.cream },
  insightBody: { marginTop: 6, fontSize: 12, lineHeight: 18, color: 'rgba(212, 183, 143, 0.82)' },
});
