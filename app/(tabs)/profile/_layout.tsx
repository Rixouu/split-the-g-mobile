import { Stack } from 'expo-router';

import { brandColors } from '@/constants/theme';

export default function ProfileStackLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: brandColors.black },
        headerTintColor: brandColors.cream,
        contentStyle: { backgroundColor: brandColors.black },
      }}>
      <Stack.Screen name="index" options={{ headerShown: false, title: 'Profile' }} />
      <Stack.Screen name="account" options={{ title: 'Account' }} />
      <Stack.Screen name="scores" options={{ headerShown: false, title: 'Scores' }} />
      <Stack.Screen name="progress" options={{ title: 'Progress' }} />
      <Stack.Screen
        name="expenses"
        options={{
          title: 'Expenses',
          headerTitleStyle: { color: brandColors.gold, fontWeight: '700' },
        }}
      />
      <Stack.Screen name="favorites" options={{ title: 'Favorite bars' }} />
      <Stack.Screen name="friends" options={{ title: 'Friends' }} />
      <Stack.Screen
        name="achievements"
        options={{
          title: 'Achievements',
          headerTintColor: brandColors.goldBright,
          headerTitleStyle: { color: brandColors.goldBright, fontWeight: '700' },
        }}
      />
    </Stack>
  );
}
