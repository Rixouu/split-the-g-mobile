import { Pressable, StyleSheet, Text, type PressableProps } from 'react-native';

import { colors, layout, radii } from '@/constants/design-tokens';

interface AppButtonProps extends PressableProps {
  label: string;
  variant?: 'primary' | 'secondary' | 'ghost' | 'outlineGold';
  /** Pill (default) vs web-style rounded rectangle on profile / forms. */
  shape?: 'pill' | 'rounded';
  fullWidth?: boolean;
  /** Denser tap target and label — list cards / secondary rows. */
  compact?: boolean;
}

export function AppButton({
  label,
  variant = 'primary',
  shape = 'pill',
  fullWidth,
  compact,
  style,
  disabled,
  ...props
}: AppButtonProps) {
  const labelStyle =
    variant === 'primary'
      ? styles.primaryLabel
      : variant === 'outlineGold'
        ? styles.outlineGoldLabel
        : variant === 'ghost'
          ? styles.ghostLabel
          : styles.secondaryLabel;

  return (
    <Pressable
      {...props}
      disabled={disabled}
      style={(state) => [
        styles.base,
        shape === 'rounded' ? styles.rounded : styles.pill,
        compact ? styles.compactHit : null,
        fullWidth ? styles.fullWidth : null,
        variant === 'primary' ? styles.primary : null,
        variant === 'secondary' ? styles.secondary : null,
        variant === 'ghost' ? styles.ghost : null,
        variant === 'outlineGold' ? styles.outlineGold : null,
        disabled && styles.disabled,
        state.pressed && !disabled && styles.pressed,
        typeof style === 'function' ? style(state) : style,
      ]}>
      <Text style={[styles.label, compact ? styles.labelCompact : null, labelStyle]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: layout.buttonMinHeight.pill,
    paddingHorizontal: layout.buttonPaddingH,
  },
  pill: {
    borderRadius: radii.pill,
  },
  rounded: {
    borderRadius: radii.buttonRounded,
    minHeight: layout.buttonMinHeight.rounded,
  },
  fullWidth: {
    alignSelf: 'stretch',
  },
  primary: {
    backgroundColor: colors.cta.primaryBg,
  },
  secondary: {
    borderWidth: 1,
    borderColor: colors.cta.secondaryBorder,
    backgroundColor: colors.cta.secondaryBg,
  },
  ghost: {
    backgroundColor: 'transparent',
  },
  outlineGold: {
    borderWidth: colors.cta.outlineBorderWidth,
    borderColor: colors.cta.outlineBorder,
    backgroundColor: 'transparent',
  },
  label: {
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 0.35,
  },
  primaryLabel: {
    color: colors.cta.primaryFg,
  },
  outlineGoldLabel: {
    color: colors.cta.outlineFg,
  },
  secondaryLabel: {
    color: colors.cta.secondaryFg,
  },
  ghostLabel: {
    color: colors.text.primary,
  },
  disabled: {
    opacity: colors.cta.disabledOpacity,
  },
  pressed: {
    opacity: colors.cta.pressedOpacity,
  },
  compactHit: {
    minHeight: 36,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  labelCompact: {
    fontSize: 12.5,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
});
