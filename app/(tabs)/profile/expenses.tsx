import { useMemo } from 'react';

import { Card, Screen } from '@/components/split-the-g/screen';
import { Body, Muted } from '@/components/split-the-g/typography';
import { useMyScores } from '@/components/profile/hooks/use-my-scores';
import { useAuth } from '@/lib/auth/auth-context';
import { useLocale } from '@/lib/i18n/locale-context';
import { computeProgressStats } from '@/lib/profile/compute-progress-stats';

export default function ProfileExpensesScreen() {
  const { user } = useAuth();
  const { t } = useLocale();
  const scores = useMyScores();
  const priced = useMemo(
    () => (scores.data ?? []).filter((s) => s.pint_price != null && Number.isFinite(Number(s.pint_price))),
    [scores.data],
  );
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

      {(scores.data?.length ?? 0) === 0 && user ? (
        <Card>
          <Muted>{t('profileScoresEmpty')}</Muted>
        </Card>
      ) : null}

      {priced.length > 0 ? (
        <Card>
          <Body style={{ fontWeight: '700', marginBottom: 8 }}>{t('profileExpensesTitle')}</Body>
          <Muted>
            {t('profileExpensesTotal')}:{' '}
            {stats.totalSpend.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </Muted>
          <Muted>
            {t('profileExpensesPriced')}: {priced.length}
          </Muted>
        </Card>
      ) : scores.data && scores.data.length > 0 ? (
        <Card>
          <Muted>Add pint prices when editing a pour to track spend.</Muted>
        </Card>
      ) : null}
    </Screen>
  );
}
