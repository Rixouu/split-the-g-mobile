import { Ionicons } from '@expo/vector-icons';
import { getHeaderTitle } from '@react-navigation/elements';
import type { NativeStackHeaderProps } from '@react-navigation/native-stack';
import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { brandColors } from '@/constants/theme';
import { useLocale } from '@/lib/i18n/locale-context';

interface NavigationBackButtonProps {
  accessibilityLabel: string;
  onPress: () => void;
}

export function NavigationBackButton({ accessibilityLabel, onPress }: NavigationBackButtonProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      hitSlop={8}
      onPress={onPress}
      style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}>
      <Ionicons name="chevron-back" size={24} color={brandColors.goldBright} />
    </Pressable>
  );
}

/** A shared header avoids the extra native glass background on iOS 26 and later. */
export function BrandStackHeader({
  options,
  route,
  fallback = '/(tabs)',
  onBack,
}: NativeStackHeaderProps & { fallback?: string; onBack?: () => void }) {
  const router = useRouter();
  const { t } = useLocale();
  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={styles.header}>
      <View style={styles.headerRow}>
        <NavigationBackButton
          accessibilityLabel={t('actionBack')}
          onPress={onBack ?? (() => {
            if (router.canGoBack()) router.back();
            else router.replace(fallback as never);
          })}
        />
        <Text accessibilityRole="header" numberOfLines={1} style={styles.title}>
          {getHeaderTitle(options, route.name)}
        </Text>
        <View style={styles.balance} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  button: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonPressed: {
    opacity: 0.82,
    transform: [{ scale: 0.96 }],
  },
  header: { backgroundColor: brandColors.black },
  headerRow: { height: 52, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12 },
  title: { flex: 1, textAlign: 'center', color: brandColors.goldBright, fontSize: 17, fontWeight: '700' },
  balance: { width: 44 },
});
