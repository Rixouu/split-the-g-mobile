import { Stack } from 'expo-router';

import { brandColors } from '@/constants/theme';

const profileStackHeader = {
  headerTitleAlign: 'center' as const,
  headerTintColor: brandColors.cream,
  headerBackButtonDisplayMode: 'minimal' as const,
  headerTitleStyle: {
    color: brandColors.goldBright,
    fontWeight: '700' as const,
  },
};

export default function ProfileStackLayout() {
  return (
    <Stack
      screenOptions={{
        ...profileStackHeader,
        headerStyle: { backgroundColor: brandColors.black },
        contentStyle: { backgroundColor: brandColors.black },
      }}>
      <Stack.Screen name="index" options={{ headerShown: false, title: 'Profile' }} />
      <Stack.Screen name="account" options={{ title: 'Account' }} />
      <Stack.Screen name="scores" options={{ title: 'Scores' }} />
      <Stack.Screen name="progress" options={{ title: 'Progress' }} />
      <Stack.Screen name="expenses" options={{ title: 'Expenses' }} />
      <Stack.Screen name="favorites" options={{ title: 'Favorite bars' }} />
      <Stack.Screen name="friends" options={{ title: 'Friends' }} />
      <Stack.Screen name="achievements" options={{ title: 'Achievements' }} />
    </Stack>
  );
}
