import { StyleSheet, View } from 'react-native';

import { AppButton } from '@/components/split-the-g/button';
import { Card, Screen } from '@/components/split-the-g/screen';
import { Body, Eyebrow, Muted, Title } from '@/components/split-the-g/typography';
import { useAuth } from '@/lib/auth/auth-context';
import { registerForPushNotifications } from '@/lib/notifications/register';

export default function ProfileScreen() {
  const { isConfigured, isLoading, signInWithGoogle, signOut, user } = useAuth();

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
            <AppButton label="Continue with Google" onPress={signInWithGoogle} />
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
});
