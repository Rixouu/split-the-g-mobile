import { Stack } from 'expo-router';

import { brandColors } from '@/constants/theme';
import { BrandStackHeader } from '@/components/split-the-g/navigation-back-button';

export default function ProfileStackLayout() {
  return (
    <Stack
      screenOptions={{
        header: (props) => <BrandStackHeader {...props} fallback="/(tabs)/profile" />,
        contentStyle: { backgroundColor: brandColors.black },
      }}>
      <Stack.Screen name="index" options={{ headerShown: false, title: 'Profile' }} />
      <Stack.Screen name="account" options={{ title: 'Account' }} />
      <Stack.Screen name="scores" options={{ title: 'Scores' }} />
      <Stack.Screen name="expenses" options={{ title: 'Expenses' }} />
      <Stack.Screen name="favorites" options={{ title: 'Favorite bars' }} />
    </Stack>
  );
}
