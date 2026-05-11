import { StyleSheet, Text, type TextProps } from 'react-native';

import { brandColors } from '@/constants/theme';

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

const styles = StyleSheet.create({
  eyebrow: {
    color: 'rgba(212, 183, 143, 0.5)',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 2.2,
    textTransform: 'uppercase',
  },
  title: {
    color: brandColors.cream,
    fontSize: 32,
    fontWeight: '800',
    lineHeight: 38,
    letterSpacing: -0.5,
  },
  tagline: {
    color: brandColors.gold,
    fontSize: 16,
    fontWeight: '600',
    lineHeight: 22,
    letterSpacing: -0.2,
  },
  body: {
    color: brandColors.cream,
    fontSize: 16,
    lineHeight: 24,
  },
  muted: {
    color: 'rgba(212, 183, 143, 0.72)',
    fontSize: 14,
    lineHeight: 21,
  },
});
