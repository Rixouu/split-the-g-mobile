import { StyleSheet, Text, type TextProps } from 'react-native';

import { brandColors } from '@/constants/theme';

export function Eyebrow({ style, ...props }: TextProps) {
  return <Text {...props} style={[styles.eyebrow, style]} />;
}

export function Title({ style, ...props }: TextProps) {
  return <Text {...props} style={[styles.title, style]} />;
}

export function Body({ style, ...props }: TextProps) {
  return <Text {...props} style={[styles.body, style]} />;
}

export function Muted({ style, ...props }: TextProps) {
  return <Text {...props} style={[styles.muted, style]} />;
}

const styles = StyleSheet.create({
  eyebrow: {
    color: brandColors.goldBright,
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 1.8,
    textTransform: 'uppercase',
  },
  title: {
    color: brandColors.cream,
    fontSize: 34,
    fontWeight: '900',
    lineHeight: 38,
  },
  body: {
    color: brandColors.cream,
    fontSize: 16,
    lineHeight: 24,
  },
  muted: {
    color: brandColors.muted,
    fontSize: 14,
    lineHeight: 21,
  },
});
