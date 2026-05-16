import { type ReactNode } from 'react';
import { Platform, StyleSheet, Text, type TextProps, View, type ViewProps } from 'react-native';

import { Eyebrow, Muted, Title } from '@/components/split-the-g/typography';
import { colors, spacing, typeScale } from '@/constants/design-tokens';

export function DiscoverSegmentHeader({
  eyebrow,
  title,
  subtitle,
  titleTrailing,
  children,
  style,
  ...rest
}: ViewProps & {
  eyebrow: string;
  title: string;
  subtitle: string;
  /** Renders on the same row as the title (e.g. secondary pill CTA), aligned to the trailing edge. */
  titleTrailing?: ReactNode;
  children?: ReactNode;
}) {
  return (
    <View style={[styles.header, style]} {...rest}>
      <Eyebrow style={styles.headerEyebrow}>{eyebrow}</Eyebrow>
      {titleTrailing ? (
        <View style={styles.titleRow}>
          <View style={styles.titleWrap}>
            <Title style={styles.headerTitle}>{title}</Title>
          </View>
          {titleTrailing}
        </View>
      ) : (
        <Title style={styles.headerTitle}>{title}</Title>
      )}
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
    gap: spacing.sm,
    paddingTop: spacing.sm,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 14,
    marginTop: 2,
  },
  titleWrap: {
    flex: 1,
    minWidth: 0,
    paddingRight: spacing.xs,
  },
  headerEyebrow: {
    letterSpacing: 1.6,
    color: colors.text.accentBright,
    opacity: 0.85,
  },
  headerTitle: {
    ...typeScale.titleCompact,
    flexShrink: 1,
  },
  headerSubtitle: typeScale.discoverMuted,
  sectionTitle: {
    ...typeScale.sectionTitle,
    ...(Platform.OS === 'android' ? { includeFontPadding: false } : {}),
  },
  sectionSpaced: {
    marginTop: spacing.xxl,
  },
});

const styles = discoverChromeStyles;
