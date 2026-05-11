import { Pressable, StyleSheet, Text, type PressableProps } from 'react-native';

import { brandColors } from '@/constants/theme';

interface AppButtonProps extends PressableProps {
  label: string;
  variant?: 'primary' | 'secondary' | 'ghost';
}

export function AppButton({ label, variant = 'primary', style, disabled, ...props }: AppButtonProps) {
  return (
    <Pressable
      {...props}
      disabled={disabled}
      style={({ pressed }) => [
        styles.base,
        styles[variant],
        disabled && styles.disabled,
        pressed && !disabled && styles.pressed,
        typeof style === 'function' ? style({ pressed }) : style,
      ]}>
      <Text style={[styles.label, variant === 'primary' ? styles.primaryLabel : styles.secondaryLabel]}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 50,
    borderRadius: 999,
    paddingHorizontal: 18,
  },
  primary: {
    backgroundColor: brandColors.gold,
  },
  secondary: {
    borderWidth: 1,
    borderColor: brandColors.border,
    backgroundColor: brandColors.panelMuted,
  },
  ghost: {
    backgroundColor: 'transparent',
  },
  label: {
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  primaryLabel: {
    color: brandColors.black,
  },
  secondaryLabel: {
    color: brandColors.cream,
  },
  disabled: {
    opacity: 0.48,
  },
  pressed: {
    opacity: 0.84,
  },
});
