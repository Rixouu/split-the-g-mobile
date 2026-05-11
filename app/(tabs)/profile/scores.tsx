import { Link } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { Card, Screen } from '@/components/split-the-g/screen';
import { Body, Muted } from '@/components/split-the-g/typography';
import { brandColors } from '@/constants/theme';
import { useMyScores } from '@/components/profile/hooks/use-my-scores';
import { useAuth } from '@/lib/auth/auth-context';
import { useLocale } from '@/lib/i18n/locale-context';
import { formatSplitScore } from '@/lib/pour/format-split-score';

export default function ProfileScoresScreen() {
  const { user } = useAuth();
  const { t } = useLocale();
  const scores = useMyScores();

  return (
    <Screen>
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

      {user && scores.data?.length === 0 ? (
        <Card>
          <Muted>{t('profileScoresEmpty')}</Muted>
        </Card>
      ) : null}

      {scores.data?.map((s) => {
        const ref = s.slug || s.id;
        return (
          <Link key={s.id} href={`/pour/${encodeURIComponent(ref)}`} asChild>
            <View style={styles.row}>
              <Body style={styles.score}>{formatSplitScore(s.split_score)}</Body>
              <View style={{ flex: 1 }}>
                <Muted numberOfLines={1}>{s.bar_name || 'Pour'}</Muted>
                <Muted numberOfLines={1}>
                  {s.created_at ? new Date(s.created_at).toLocaleDateString() : ''}
                </Muted>
              </View>
            </View>
          </Link>
        );
      })}
    </Screen>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: brandColors.frame,
    borderRadius: 14,
    padding: 14,
    backgroundColor: 'rgba(29, 24, 15, 0.35)',
    marginBottom: 10,
  },
  score: {
    fontSize: 22,
    fontWeight: '800',
    color: brandColors.goldBright,
    minWidth: 56,
  },
});
