import { type ReactNode } from 'react';
import { Platform, StyleSheet, Text, type TextProps, View, type ViewProps } from 'react-native';

import { Eyebrow, Muted, Title } from '@/components/split-the-g/typography';
import { brandColors } from '@/constants/theme';

export function DiscoverSegmentHeader({
  eyebrow,
  title,
  subtitle,
  children,
  style,
  ...rest
}: ViewProps & {
  eyebrow: string;
  title: string;
  subtitle: string;
  children?: ReactNode;
}) {
  return (
    <View style={[styles.header, style]} {...rest}>
      <Eyebrow style={styles.headerEyebrow}>{eyebrow}</Eyebrow>
      <Title style={styles.headerTitle}>{title}</Title>
      <Muted style={styles.headerSubtitle} numberOfLines={2}>
        {subtitle}
      </Muted>
      {children}
    </View>
  );
}

export function DiscoverSectionTitle({ style, ...props }: TextProps) {
  return <Text style={[styles.sectionTitle, style]} {...props} />;
}

export const discoverChromeStyles = StyleSheet.create({
  header: {
    marginBottom: 14,
    gap: 6,
    paddingTop: 6,
  },
  headerEyebrow: {
    letterSpacing: 1.6,
    color: brandColors.goldBright,
    opacity: 0.85,
  },
  headerTitle: {
    fontSize: 28,
    lineHeight: 34,
    letterSpacing: -0.45,
  },
  headerSubtitle: {
    fontSize: 13,
    lineHeight: 18,
    marginTop: 2,
    color: 'rgba(212, 183, 143, 0.62)',
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1.35,
    textTransform: 'uppercase',
    color: brandColors.goldBright,
    marginBottom: 8,
    opacity: 0.92,
    ...(Platform.OS === 'android' ? { includeFontPadding: false } : {}),
  },
  sectionSpaced: {
    marginTop: 24,
  },
});

const styles = discoverChromeStyles;
