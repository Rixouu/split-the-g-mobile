import { useMemo } from 'react';
import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useMyScores } from '@/components/profile/hooks/use-my-scores';
import { Screen, UNDER_STACK_HEADER_SAFE_AREA_EDGES } from '@/components/split-the-g/screen';
import { ScreenLoadingBlock } from '@/components/split-the-g/screen-loading';
import { Body, Muted } from '@/components/split-the-g/typography';
import { brandColors } from '@/constants/theme';
import type { MyScoreRow } from '@/lib/api/profile';
import { useAuth } from '@/lib/auth/auth-context';
import { useLocale } from '@/lib/i18n/locale-context';
import { computeProgressStats } from '@/lib/profile/compute-progress-stats';

const EM_DASH = '\u2014';

function formatMoney(n: number, minFrac: number, maxFrac: number) {
  return n.toLocaleString(undefined, { minimumFractionDigits: minFrac, maximumFractionDigits: maxFrac });
}

function formatPourDate(iso: string) {
  try {
    return new Date(iso).toLocaleString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  } catch {
    return '';
  }
}

function pickMaxPricedPour(rows: MyScoreRow[]): MyScoreRow | null {
  if (rows.length === 0) return null;
  let best = rows[0]!;
  let bestN = Number(best.pint_price);
  for (const s of rows) {
    const n = Number(s.pint_price);
    if (n > bestN) {
      best = s;
      bestN = n;
    }
  }
  return best;
}

export default function ProfileExpensesScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { t } = useLocale();
  const scores = useMyScores();
  const rows = scores.data ?? [];

  const pricedPours = useMemo(
    () => rows.filter((s) => s.pint_price != null && Number.isFinite(Number(s.pint_price))),
    [rows],
  );

  const stats = useMemo(() => computeProgressStats(rows), [rows]);
  const avgPrice = pricedPours.length > 0 ? stats.totalSpend / pricedPours.length : 0;
  const maxPour = useMemo(() => pickMaxPricedPour(pricedPours), [pricedPours]);

  return (
    <Screen edges={UNDER_STACK_HEADER_SAFE_AREA_EDGES}>
      {!user ? (
        <View style={styles.card}>
          <Body>{t('signInPrompt')}</Body>
        </View>
      ) : null}

      {user && scores.isLoading ? <ScreenLoadingBlock /> : null}

      {user && scores.error ? (
        <View style={styles.card}>
          <Body>{scores.error.message}</Body>
        </View>
      ) : null}

      {user && !scores.isLoading && !scores.error && rows.length === 0 ? (
        <View style={styles.card}>
          <Muted style={styles.intro}>{t('profileScoresEmptyBlurb')}</Muted>
        </View>
      ) : null}

      {user && !scores.isLoading && !scores.error && rows.length > 0 ? (
        <>
          <Muted style={styles.intro}>{t('profileExpensesIntroBlurb')}</Muted>

          <View style={styles.hero}>
            <Muted style={styles.heroLabel}>{t('profileExpensesSpendTrackedLabel')}</Muted>
            <Text style={styles.heroValue} accessibilityRole="text">
              {stats.totalSpend > 0 ? formatMoney(stats.totalSpend, 2, 2) : EM_DASH}
            </Text>
            <Muted style={styles.heroHint}>{t('profileExpensesSpendTrackedHint')}</Muted>
          </View>

          <View style={styles.statRow}>
            <View style={styles.statCell}>
              <Text style={styles.statLabel}>{t('profileExpensesPricedPoursLabel')}</Text>
              <Text style={styles.statValue} accessibilityRole="text">
                {pricedPours.length}
              </Text>
            </View>
            <View style={styles.statCell}>
              <Text style={styles.statLabel}>{t('profileExpensesAvgPriceLabel')}</Text>
              <Text style={styles.statValue} accessibilityRole="text">
                {pricedPours.length > 0 ? formatMoney(avgPrice, 2, 2) : EM_DASH}
              </Text>
            </View>
            <View style={styles.statCell}>
              <Text style={styles.statLabel}>{t('profileExpensesHighestPourLabel')}</Text>
              <Text style={styles.statValue} accessibilityRole="text">
                {maxPour
                  ? formatMoney(Number(maxPour.pint_price), 0, 2)
                  : EM_DASH}
              </Text>
              {maxPour?.bar_name ? (
                <Text style={styles.statPub} numberOfLines={2}>
                  {maxPour.bar_name}
                </Text>
              ) : maxPour ? (
                <Muted style={styles.statPubFallback}>{t('profileExpensesFromPricedPours')}</Muted>
              ) : null}
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t('profileExpensesRecentPricedTitle')}</Text>
            <Muted style={styles.sectionBlurb}>{t('profileExpensesRecentPricedBlurb')}</Muted>
            {pricedPours.length > 0 ? (
              <View style={styles.list}>
                {pricedPours.map((s) => {
                  const ref = encodeURIComponent(s.slug || s.id);
                  return (
                    <Pressable
                      key={s.id}
                      accessibilityRole="button"
                      onPress={() => router.push(`/pour/${ref}`)}
                      style={({ pressed }) => [styles.listRow, pressed && styles.listRowPressed]}>
                      <View style={styles.listRowTop}>
                        <Text style={styles.listPrice}>
                          {formatMoney(Number(s.pint_price), 0, 2)}
                        </Text>
                        <Muted style={styles.listDate}>{formatPourDate(s.created_at)}</Muted>
                      </View>
                      {s.bar_name ? (
                        <Muted style={styles.listPub} numberOfLines={2}>
                          {s.bar_name}
                        </Muted>
                      ) : null}
                    </Pressable>
                  );
                })}
              </View>
            ) : (
              <Muted style={styles.noPrices}>{t('profileExpensesNoPricesYet')}</Muted>
            )}
          </View>
        </>
      ) : null}
    </Screen>
  );
}

const BORDER = brandColors.pourCardStroke;

const styles = StyleSheet.create({
  card: {
    gap: 14,
    borderWidth: 1,
    borderColor: brandColors.frame,
    borderRadius: 14,
    backgroundColor: 'rgba(29, 24, 15, 0.35)',
    padding: 18,
  },
  intro: {
    textAlign: 'center',
    color: 'rgba(212, 183, 143, 0.75)',
    lineHeight: 21,
  },
  hero: {
    alignItems: 'center',
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 16,
    backgroundColor: 'rgba(29, 24, 15, 0.35)',
    paddingVertical: 20,
    paddingHorizontal: 20,
    gap: 8,
  },
  heroLabel: {
    textAlign: 'center',
    color: 'rgba(212, 183, 143, 0.7)',
    fontSize: 13,
  },
  heroValue: {
    marginTop: 4,
    fontSize: 44,
    fontWeight: '800',
    color: brandColors.gold,
    letterSpacing: -0.5,
    fontVariant: ['tabular-nums'],
  },
  heroHint: {
    textAlign: 'center',
    marginTop: 8,
    maxWidth: 320,
    alignSelf: 'center',
    color: 'rgba(212, 183, 143, 0.5)',
    fontSize: 12,
    lineHeight: 18,
  },
  statRow: {
    flexDirection: 'row',
    gap: 8,
  },
  statCell: {
    flex: 1,
    minWidth: 0,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 12,
    backgroundColor: 'rgba(29, 24, 15, 0.3)',
    paddingVertical: 10,
    paddingHorizontal: 6,
    gap: 4,
  },
  statLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: 'rgba(212, 183, 143, 0.7)',
    textAlign: 'center',
    lineHeight: 14,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    color: brandColors.goldBright,
    fontVariant: ['tabular-nums'],
  },
  statPub: {
    marginTop: 2,
    fontSize: 10,
    lineHeight: 14,
    color: 'rgba(212, 183, 143, 0.55)',
    textAlign: 'center',
  },
  statPubFallback: {
    marginTop: 2,
    fontSize: 11,
    textAlign: 'center',
    color: 'rgba(212, 183, 143, 0.5)',
  },
  section: {
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 16,
    backgroundColor: 'rgba(29, 24, 15, 0.25)',
    padding: 16,
    gap: 8,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: brandColors.gold,
    letterSpacing: -0.2,
  },
  sectionBlurb: {
    marginTop: 2,
    color: 'rgba(212, 183, 143, 0.65)',
    fontSize: 13,
    lineHeight: 19,
  },
  list: {
    marginTop: 12,
    gap: 8,
  },
  listRow: {
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 12,
    backgroundColor: 'rgba(11, 11, 11, 0.3)',
    paddingVertical: 12,
    paddingHorizontal: 14,
    gap: 6,
  },
  listRowPressed: {
    borderColor: 'rgba(179, 139, 45, 0.35)',
  },
  listRowTop: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    gap: 8,
  },
  listPrice: {
    fontSize: 18,
    fontWeight: '600',
    color: brandColors.cream,
    fontVariant: ['tabular-nums'],
  },
  listDate: {
    flexShrink: 0,
    fontSize: 12,
    color: 'rgba(212, 183, 143, 0.6)',
  },
  listPub: {
    fontSize: 13,
    color: 'rgba(212, 183, 143, 0.55)',
  },
  noPrices: {
    marginTop: 12,
    color: 'rgba(212, 183, 143, 0.7)',
    fontSize: 14,
    lineHeight: 21,
  },
});
