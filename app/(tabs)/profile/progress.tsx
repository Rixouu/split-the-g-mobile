import { Card, Screen } from '@/components/split-the-g/screen';
import { Body, Muted } from '@/components/split-the-g/typography';
import { ProfileProgressDashboard } from '@/components/profile/profile-progress-dashboard';
import { useProfileHubData } from '@/components/profile/hooks/use-profile-hub-data';
import { useAuth } from '@/lib/auth/auth-context';
import { useLocale } from '@/lib/i18n/locale-context';

export default function ProfileProgressScreen() {
  const { user } = useAuth();
  const { t } = useLocale();
  const hub = useProfileHubData();

  const scores = hub.data?.scores ?? [];

  return (
    <Screen>
      {!user ? (
        <Card>
          <Body>{t('signInPrompt')}</Body>
        </Card>
      ) : null}

      {user && hub.isLoading ? (
        <Card>
          <Body>{t('commonLoading')}</Body>
        </Card>
      ) : null}

      {user && hub.isError ? (
        <Card>
          <Body>{t('profileProgressLoadError')}</Body>
        </Card>
      ) : null}

      {user && !hub.isLoading && !hub.isError && scores.length === 0 ? (
        <Card>
          <Muted>{t('profileScoresEmptyBlurb')}</Muted>
        </Card>
      ) : null}

      {user && !hub.isLoading && !hub.isError && scores.length > 0 && hub.data ? (
        <ProfileProgressDashboard
          scores={scores}
          comparisonScores={hub.data.comparisonScores}
          comparisonLabels={hub.data.comparisonLabels}
          userEmail={user.email ?? null}
          streakSnapshot={hub.data.streakSnapshot}
        />
      ) : null}
    </Screen>
  );
}
