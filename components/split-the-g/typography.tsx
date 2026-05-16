import { Platform, StyleSheet, Text, type TextProps } from 'react-native';

import { typeScale } from '@/constants/design-tokens';

export function Eyebrow({ style, ...props }: TextProps) {
  return <Text {...props} style={[styles.eyebrow, style]} />;
}

export function Title({ style, ...props }: TextProps) {
  return <Text {...props} style={[styles.title, style]} />;
}

/** Gold tagline — matches web home `h2` emphasis. */
export function Tagline({ style, ...props }: TextProps) {
  return <Text {...props} style={[styles.tagline, style]} />;
}

export function Body({ style, ...props }: TextProps) {
  return <Text {...props} style={[styles.body, style]} />;
}

export function Muted({ style, ...props }: TextProps) {
  return <Text {...props} style={[styles.muted, style]} />;
}

const androidText = Platform.OS === 'android' ? { includeFontPadding: false } : {};

const styles = StyleSheet.create({
  eyebrow: {
    ...androidText,
    ...typeScale.overline,
  },
  title: {
    ...androidText,
    ...typeScale.title,
  },
  tagline: {
    ...androidText,
    ...typeScale.tagline,
  },
  body: {
    ...androidText,
    ...typeScale.body,
  },
  muted: {
    ...androidText,
    ...typeScale.bodySmall,
  },
});
