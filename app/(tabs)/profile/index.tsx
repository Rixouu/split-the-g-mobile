import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppButton } from '@/components/split-the-g/button';
import { Card, Screen } from '@/components/split-the-g/screen';
import { Body, Eyebrow, Muted, Title } from '@/components/split-the-g/typography';
import { brandColors } from '@/constants/theme';
import { useAuth } from '@/lib/auth/auth-context';
import { useLocale } from '@/lib/i18n/locale-context';

function ProfileLinkRow({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.linkRow, pressed && styles.linkRowPressed]}
      accessibilityRole="button">
      <Body style={styles.linkLabel}>{label}</Body>
      <Ionicons name="chevron-forward" size={18} color={brandColors.tanMuted} />
    </Pressable>
  );
}

export default function ProfileHubScreen() {
  const router = useRouter();
  const { isConfigured, isLoading, signInWithGoogle, user } = useAuth();
  const { t } = useLocale();

  return (
    <Screen>
      <View style={styles.header}>
        <Eyebrow>{t('navMe')}</Eyebrow>
        <Title>{t('profileHubTitle')}</Title>
        <Muted>{t('profileHubSubtitle')}</Muted>
      </View>

      {!isConfigured ? (
        <Card>
          <Body>{t('errorSupabaseEnvTitle')}</Body>
          <Muted>{t('errorSupabaseEnvBody')}</Muted>
        </Card>
      ) : null}

      <Card>
        <ProfileLinkRow label={t('profileNavAccount')} onPress={() => router.push('/profile/account')} />
        <View style={styles.divider} />
        <ProfileLinkRow label={t('profileNavScores')} onPress={() => router.push('/profile/scores')} />
        <View style={styles.divider} />
        <ProfileLinkRow label={t('profileNavProgress')} onPress={() => router.push('/profile/progress')} />
        <View style={styles.divider} />
        <ProfileLinkRow label={t('profileNavExpenses')} onPress={() => router.push('/profile/expenses')} />
        <View style={styles.divider} />
        <ProfileLinkRow label={t('profileNavFavorites')} onPress={() => router.push('/profile/favorites')} />
        <View style={styles.divider} />
        <ProfileLinkRow label={t('profileNavFriends')} onPress={() => router.push('/profile/friends')} />
        <View style={styles.divider} />
        <ProfileLinkRow label={t('profileNavAchievements')} onPress={() => router.push('/profile/achievements')} />
        <View style={styles.divider} />
        <ProfileLinkRow label={t('profileNavFaq')} onPress={() => router.push('/faq')} />
      </Card>

      <Card>
        <Eyebrow style={{ marginBottom: 8 }}>Shortcuts</Eyebrow>
        <ProfileLinkRow label={t('navLang')} onPress={() => router.push('/language')} />
        <View style={styles.divider} />
        <ProfileLinkRow label={t('navCompete')} onPress={() => router.push('/compete')} />
        <View style={styles.divider} />
        <ProfileLinkRow label={t('navLeaderboard')} onPress={() => router.push('/leaderboard')} />
      </Card>

      <Card>
        {isLoading ? <Body>Checking session…</Body> : null}
        {!isLoading && !user ? (
          <>
            <Body>{t('signInPrompt')}</Body>
            <AppButton label={t('signInGoogle')} onPress={signInWithGoogle} />
          </>
        ) : null}
        {!isLoading && user ? (
          <>
            <Body>{user.email}</Body>
            <Muted>{t('profileNextSteps')}</Muted>
          </>
        ) : null}
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    gap: 10,
    paddingTop: 16,
  },
  linkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  linkRowPressed: {
    opacity: 0.85,
  },
  linkLabel: {
    flex: 1,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: brandColors.borderSubtle,
  },
});
