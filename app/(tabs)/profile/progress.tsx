import { Card, Screen } from '@/components/split-the-g/screen';
import { Body, Muted } from '@/components/split-the-g/typography';
import { useMyScores } from '@/components/profile/hooks/use-my-scores';
import { useAuth } from '@/lib/auth/auth-context';
import { useLocale } from '@/lib/i18n/locale-context';
import { computeProgressStats } from '@/lib/profile/compute-progress-stats';
import { formatSplitScore } from '@/lib/pour/format-split-score';

export default function ProfileProgressScreen() {
  const { user } = useAuth();
  const { t } = useLocale();
  const scores = useMyScores();
  const stats = computeProgressStats(scores.data ?? []);

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

      {user && (scores.data?.length ?? 0) === 0 ? (
        <Card>
          <Muted>{t('profileScoresEmpty')}</Muted>
        </Card>
      ) : null}

      {stats.count > 0 ? (
        <Card>
          <Body style={{ fontWeight: '700', marginBottom: 8 }}>{t('profileProgressTitle')}</Body>
          <Muted>
            {t('profileProgressTotalPints')}: {stats.count}
          </Muted>
          <Muted>
            {t('profileProgressAvg')}: {formatSplitScore(stats.avg)}
          </Muted>
          <Muted>
            {t('profileProgressBest')}: {formatSplitScore(stats.best)}
          </Muted>
          <Muted>
            {t('profileProgressLast7')}: {stats.last7}
          </Muted>
        </Card>
      ) : null}
    </Screen>
  );
}
