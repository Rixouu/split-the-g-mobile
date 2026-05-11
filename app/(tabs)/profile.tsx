import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppButton } from '@/components/split-the-g/button';
import { Card, Screen } from '@/components/split-the-g/screen';
import { Body, Eyebrow, Muted, Title } from '@/components/split-the-g/typography';
import { brandColors } from '@/constants/theme';
import { useAuth } from '@/lib/auth/auth-context';
import { useLocale } from '@/lib/i18n/locale-context';
import { registerForPushNotifications } from '@/lib/notifications/register';

function ProfileLinkRow({
  label,
  onPress,
}: {
  label: string;
  onPress: () => void;
}) {
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

export default function ProfileScreen() {
  const router = useRouter();
  const { isConfigured, isLoading, signInWithGoogle, signOut, user } = useAuth();
  const { t } = useLocale();

  return (
    <Screen>
      <View style={styles.header}>
        <Eyebrow>Account</Eyebrow>
        <Title>Your Split The G profile</Title>
        <Muted>Google OAuth is wired for Supabase native sessions with SecureStore persistence.</Muted>
      </View>

      {!isConfigured ? (
        <Card>
          <Body>Supabase env is missing.</Body>
          <Muted>Configure EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY.</Muted>
        </Card>
      ) : null}

      <Card>
        <Eyebrow style={styles.sectionEyebrow}>Navigation</Eyebrow>
        <ProfileLinkRow label={t('navLang')} onPress={() => router.push('/language')} />
        <View style={styles.linkDivider} />
        <ProfileLinkRow label={t('navCompete')} onPress={() => router.push('/compete')} />
        <View style={styles.linkDivider} />
        <ProfileLinkRow label={t('navLeaderboard')} onPress={() => router.push('/leaderboard')} />
      </Card>

      <Card>
        {isLoading ? <Body>Checking session...</Body> : null}
        {!isLoading && user ? (
          <>
            <Body>{user.email || 'Signed in'}</Body>
            <Muted>User ID: {user.id}</Muted>
            <AppButton
              label="Enable push notifications"
              onPress={() => registerForPushNotifications(user.id)}
            />
            <AppButton label="Sign out" variant="secondary" onPress={signOut} />
          </>
        ) : null}
        {!isLoading && !user ? (
          <>
            <Body>Sign in to claim pours, sync profile progress, and join competitions.</Body>
            <AppButton label={t('signInGoogle')} onPress={signInWithGoogle} />
          </>
        ) : null}
      </Card>

      <Card>
        <Body>Next profile parity</Body>
        <Muted>
          Achievements, expenses, friends, favorites, and notification preferences can be migrated
          screen-by-screen using the same Supabase tables/RPCs from the web app.
        </Muted>
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    gap: 10,
    paddingTop: 16,
  },
  sectionEyebrow: {
    marginBottom: 8,
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
  linkDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: brandColors.borderSubtle,
  },
});
