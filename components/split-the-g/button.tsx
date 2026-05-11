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
      style={(state) => [
        styles.base,
        variant === 'primary' ? styles.primary : null,
        variant === 'secondary' ? styles.secondary : null,
        variant === 'ghost' ? styles.ghost : null,
        disabled && styles.disabled,
        state.pressed && !disabled && styles.pressed,
        typeof style === 'function' ? style(state) : style,
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
    minHeight: 52,
    borderRadius: 999,
    paddingHorizontal: 20,
  },
  primary: {
    backgroundColor: brandColors.gold,
  },
  secondary: {
    borderWidth: 1,
    borderColor: 'rgba(179, 139, 45, 0.42)',
    backgroundColor: 'rgba(11, 11, 11, 0.55)',
  },
  ghost: {
    backgroundColor: 'transparent',
  },
  label: {
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 0.35,
  },
  primaryLabel: {
    color: brandColors.black,
  },
  secondaryLabel: {
    color: brandColors.cream,
  },
  disabled: {
    opacity: 0.45,
  },
  pressed: {
    opacity: 0.88,
  },
});
