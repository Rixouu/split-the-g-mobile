import { Link, Stack } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Card, Screen, UNDER_STACK_HEADER_SAFE_AREA_EDGES } from '@/components/split-the-g/screen';
import { ScreenLoadingBlock } from '@/components/split-the-g/screen-loading';
import { Body, Muted } from '@/components/split-the-g/typography';
import { brandColors } from '@/constants/theme';
import { useMyScores } from '@/components/profile/hooks/use-my-scores';
import { useAuth } from '@/lib/auth/auth-context';
import { useLocale } from '@/lib/i18n/locale-context';
import { formatSplitScore } from '@/lib/pour/format-split-score';

export default function ProfileScoresScreen() {
  const { user } = useAuth();
  const { t, tVars, locale } = useLocale();
  const scores = useMyScores();

  const list = scores.data ?? [];
  const hasScores = list.length > 0;

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
        <Muted style={styles.emptyBlurb}>{t('profileScoresEmptyBlurb')}</Muted>
      ) : null}

      {user && !scores.isLoading && !scores.error && hasScores ? (
        <>
          <Text style={styles.sectionTitle}>{t('profileScoresRecentTitle')}</Text>
          {list.map((s) => {
            const ref = s.slug || s.id;
            const price = s.pint_price;
            const showPaid =
              price != null && Number.isFinite(Number(price));
            const dateStr = s.created_at
              ? new Date(s.created_at).toLocaleDateString(locale)
              : '';
            return (
              <Link key={s.id} href={`/pour/${encodeURIComponent(ref)}`} asChild>
                <Pressable
                  style={({ pressed }) => [styles.scoreCard, pressed && styles.scoreCardPressed]}
                  accessibilityRole="link">
                  <View style={styles.scoreRowTop}>
                    <Text style={styles.scoreValue} numberOfLines={1}>
                      {formatSplitScore(s.split_score)}
                    </Text>
                    <Text style={styles.scoreDate} numberOfLines={1}>
                      {dateStr}
                    </Text>
                  </View>
                  {s.bar_name ? (
                    <Text style={styles.barName} numberOfLines={2}>
                      {s.bar_name}
                    </Text>
                  ) : null}
                  {showPaid ? (
                    <Text style={styles.paidLine} numberOfLines={1}>
                      {tVars('profileScoresPaid', {
                        amount: Number(price).toLocaleString(locale, {
                          minimumFractionDigits: 0,
                          maximumFractionDigits: 2,
                        }),
                      })}
                    </Text>
                  ) : null}
                </Pressable>
              </Link>
            );
          })}
        </>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  screenContent: {
    paddingTop: 8,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: brandColors.goldBright,
    marginBottom: 4,
    letterSpacing: -0.2,
  },
  emptyBlurb: {
    fontSize: 14,
    lineHeight: 21,
    color: 'rgba(212, 183, 143, 0.7)',
  },
  scoreCard: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: brandColors.borderSubtle,
    backgroundColor: 'rgba(29, 24, 15, 0.35)',
    padding: 16,
    marginBottom: 12,
  },
  scoreCardPressed: {
    borderColor: 'rgba(179, 139, 45, 0.35)',
    backgroundColor: 'rgba(29, 24, 15, 0.5)',
  },
  scoreRowTop: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    gap: 8,
  },
  scoreValue: {
    fontSize: 24,
    fontWeight: '800',
    color: brandColors.goldBright,
    fontVariant: ['tabular-nums'],
  },
  scoreDate: {
    fontSize: 13,
    fontWeight: '500',
    color: 'rgba(212, 183, 143, 0.65)',
    fontVariant: ['tabular-nums'],
  },
  barName: {
    marginTop: 8,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '500',
    color: 'rgba(212, 183, 143, 0.55)',
  },
  paidLine: {
    marginTop: 4,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '500',
    color: 'rgba(212, 183, 143, 0.45)',
  },
});
