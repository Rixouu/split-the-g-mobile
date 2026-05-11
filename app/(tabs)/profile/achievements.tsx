import { useQuery } from '@tanstack/react-query';
import { Card, Screen } from '@/components/split-the-g/screen';
import { Body, Muted } from '@/components/split-the-g/typography';
import { fetchMyAchievementCodes } from '@/lib/api/profile';
import { useAuth } from '@/lib/auth/auth-context';
import { useLocale } from '@/lib/i18n/locale-context';
import { labelForAchievementCode } from '@/lib/profile/achievement-labels';

export default function ProfileAchievementsScreen() {
  const { user } = useAuth();
  const { t } = useLocale();

  const ach = useQuery({
    queryKey: ['achievements', user?.id],
    queryFn: () => fetchMyAchievementCodes(user!.id),
    enabled: Boolean(user?.id),
  });

  return (
    <Screen>
      {!user ? (
        <Card>
          <Body>{t('signInPrompt')}</Body>
        </Card>
      ) : null}

      {ach.isLoading ? (
        <Card>
          <Body>{t('commonLoading')}</Body>
        </Card>
      ) : null}

      {user && (ach.data?.length ?? 0) === 0 ? (
        <Card>
          <Muted>{t('profileAchievementsEmpty')}</Muted>
        </Card>
      ) : null}

      <Card>
        <Body style={{ fontWeight: '700', marginBottom: 8 }}>{t('profileAchievementsTitle')}</Body>
      </Card>

      {ach.data?.map((code) => (
        <Card key={code}>
          <Body>{labelForAchievementCode(code)}</Body>
          <Muted>{code}</Muted>
        </Card>
      ))}
    </Screen>
  );
}
