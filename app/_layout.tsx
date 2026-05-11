import { ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';

import { brandColors } from '@/constants/theme';
import { AppProviders } from '@/lib/providers';

export const unstable_settings = {
  anchor: '(tabs)',
};

const splitTheGTheme = {
  dark: true,
  colors: {
    primary: brandColors.gold,
    background: brandColors.black,
    card: brandColors.panel,
    text: brandColors.cream,
    border: brandColors.border,
    notification: brandColors.gold,
  },
  fonts: {
    regular: { fontFamily: 'System', fontWeight: '400' as const },
    medium: { fontFamily: 'System', fontWeight: '500' as const },
    bold: { fontFamily: 'System', fontWeight: '700' as const },
    heavy: { fontFamily: 'System', fontWeight: '900' as const },
  },
};

export default function RootLayout() {
  return (
    <AppProviders>
      <ThemeProvider value={splitTheGTheme}>
        <Stack
          screenOptions={{
            contentStyle: { backgroundColor: brandColors.black },
            headerStyle: { backgroundColor: brandColors.black },
            headerTintColor: brandColors.cream,
          }}>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="pour/[pourRef]" options={{ title: 'Pour result' }} />
          <Stack.Screen name="competition/create" options={{ title: 'Create competition' }} />
          <Stack.Screen name="competition/[competitionId]" options={{ title: 'Competition' }} />
          <Stack.Screen name="competition/[competitionId]/edit" options={{ title: 'Edit competition' }} />
          <Stack.Screen name="pub/[barKey]" options={{ title: 'Pub' }} />
          <Stack.Screen name="leaderboard/index" options={{ title: 'Leaderboard' }} />
          <Stack.Screen name="leaderboard/country-stats" options={{ title: 'Countries' }} />
          <Stack.Screen name="score/[splitId]" options={{ title: 'Pour' }} />
          <Stack.Screen name="faq" options={{ title: 'FAQ' }} />
          <Stack.Screen
            name="language"
            options={{
              presentation: 'modal',
              title: 'Language',
              headerStyle: { backgroundColor: brandColors.black },
              headerTintColor: brandColors.cream,
            }}
          />
          <Stack.Screen name="auth/callback" options={{ headerShown: false }} />
          <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Split The G' }} />
        </Stack>
        <StatusBar style="light" />
      </ThemeProvider>
    </AppProviders>
  );
}
