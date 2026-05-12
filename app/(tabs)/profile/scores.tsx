import { Link, router } from 'expo-router';
import { useCallback } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { AppButton } from '@/components/split-the-g/button';
import { Card, Screen } from '@/components/split-the-g/screen';
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

  const goProfileHub = useCallback(() => {
    router.replace('/profile');
  }, []);

  const showSignedInChrome = Boolean(user);
  const list = scores.data ?? [];
  const hasScores = list.length > 0;

  return (
    <Screen contentContainerStyle={styles.screenContent}>
      {showSignedInChrome ? (
        <View style={styles.subHeader} accessibilityRole="header">
          <View style={styles.headerGrid}>
            <View style={[styles.headerSide, styles.headerSideLeft]}>
              <Pressable
                onPress={goProfileHub}
                style={({ pressed }) => [styles.backTop, pressed && styles.backPressed]}
                accessibilityRole="button"
                accessibilityLabel={t('actionBack')}>
                <Text style={styles.backTopLabel}>{t('actionBack')}</Text>
              </Pressable>
            </View>
            <Text style={styles.pageTitle} numberOfLines={1}>
              {t('profileNavScores')}
            </Text>
            <View style={styles.headerSide} />
          </View>
        </View>
      ) : null}

      {!user ? (
        <Card>
          <Body>{t('signInPrompt')}</Body>
        </Card>
      ) : null}

      {scores.isLoading ? (
        <Card>
          <Body>{t('commonLoading')}</Body>
        </Card>
      ) : null}

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

      {user && !scores.isLoading && !scores.error ? (
        <AppButton
          label={t('actionBack')}
          variant="outlineGold"
          shape="rounded"
          fullWidth
          onPress={goProfileHub}
        />
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  screenContent: {
    paddingTop: 8,
  },
  subHeader: {
    marginBottom: 20,
    paddingBottom: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(212, 175, 55, 0.12)',
  },
  headerGrid: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  headerSide: {
    flex: 1,
    minWidth: 0,
    justifyContent: 'center',
  },
  headerSideLeft: {
    alignItems: 'flex-start',
  },
  backTop: {
    minHeight: 40,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.4)',
    backgroundColor: 'rgba(11, 11, 11, 0.6)',
    justifyContent: 'center',
  },
  backPressed: {
    backgroundColor: 'rgba(197, 160, 89, 0.1)',
    borderColor: 'rgba(212, 175, 55, 0.55)',
  },
  backTopLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: brandColors.goldBright,
  },
  pageTitle: {
    flexShrink: 1,
    maxWidth: '72%',
    textAlign: 'center',
    fontSize: 22,
    fontWeight: '800',
    lineHeight: 26,
    color: brandColors.goldBright,
    letterSpacing: -0.3,
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
