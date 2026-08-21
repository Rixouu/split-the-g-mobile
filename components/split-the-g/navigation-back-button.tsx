import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet } from 'react-native';

import { brandColors } from '@/constants/theme';

interface NavigationBackButtonProps {
  accessibilityLabel: string;
  onPress: () => void;
}

/** A centered, circular version of the app's native-style minimal chevron. */
export function NavigationBackButton({ accessibilityLabel, onPress }: NavigationBackButtonProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      hitSlop={8}
      onPress={onPress}
      style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}>
      <Ionicons name="chevron-back" size={21} color={brandColors.cream} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    width: 40,
    height: 40,
    marginLeft: -2,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: brandColors.frame,
    backgroundColor: brandColors.panel,
  },
  buttonPressed: {
    opacity: 0.82,
    transform: [{ scale: 0.96 }],
  },
});
