import { Pressable, StyleSheet, Text, type PressableProps } from 'react-native';

import { brandColors } from '@/constants/theme';

interface AppButtonProps extends PressableProps {
  label: string;
  variant?: 'primary' | 'secondary' | 'ghost' | 'outlineGold';
  /** Pill (default) vs web-style rounded rectangle on profile / forms. */
  shape?: 'pill' | 'rounded';
  fullWidth?: boolean;
}

export function AppButton({
  label,
  variant = 'primary',
  shape = 'pill',
  fullWidth,
  style,
  disabled,
  ...props
}: AppButtonProps) {
  const labelStyle =
    variant === 'primary'
      ? styles.primaryLabel
      : variant === 'outlineGold'
        ? styles.outlineGoldLabel
        : styles.secondaryLabel;

  return (
    <Pressable
      {...props}
      disabled={disabled}
      style={(state) => [
        styles.base,
        shape === 'rounded' ? styles.rounded : styles.pill,
        fullWidth ? styles.fullWidth : null,
        variant === 'primary' ? styles.primary : null,
        variant === 'secondary' ? styles.secondary : null,
        variant === 'ghost' ? styles.ghost : null,
        variant === 'outlineGold' ? styles.outlineGold : null,
        disabled && styles.disabled,
        state.pressed && !disabled && styles.pressed,
        typeof style === 'function' ? style(state) : style,
      ]}>
      <Text style={[styles.label, labelStyle]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 52,
    paddingHorizontal: 20,
  },
  pill: {
    borderRadius: 999,
  },
  rounded: {
    borderRadius: 10,
    minHeight: 48,
  },
  fullWidth: {
    alignSelf: 'stretch',
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
  outlineGold: {
    borderWidth: 2,
    borderColor: 'rgba(179, 139, 45, 0.45)',
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
  outlineGoldLabel: {
    color: brandColors.gold,
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
