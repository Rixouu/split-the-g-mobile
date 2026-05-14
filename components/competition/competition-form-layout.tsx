import type { ReactNode } from 'react';
import { Platform, StyleSheet, View } from 'react-native';

import { DiscoverSectionTitle, discoverChromeStyles } from '@/components/split-the-g/discover-feed-chrome';
import { brandColors } from '@/constants/theme';

type SectionSpacing = 'afterHero' | 'section';

export function CompetitionFormSection({
  title,
  children,
  spacing = 'section',
}: {
  title: string;
  children: ReactNode;
  spacing?: SectionSpacing;
}) {
  return (
    <View style={spacing === 'section' ? discoverChromeStyles.sectionSpaced : styles.afterHero}>
      <DiscoverSectionTitle>{title}</DiscoverSectionTitle>
      {children}
    </View>
  );
}

export function CompetitionFormInset({ children }: { children: ReactNode }) {
  return <View style={competitionFormStyles.inset}>{children}</View>;
}

export function CompetitionFormHairline() {
  return <View style={competitionFormStyles.hairline} />;
}

export const competitionFormStyles = StyleSheet.create({
  inset: {
    borderRadius: 16,
    backgroundColor: 'rgba(29, 24, 15, 0.52)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: brandColors.borderSubtle,
    overflow: 'hidden',
  },
  hairline: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: brandColors.borderSubtle,
    marginLeft: 14,
  },
  stackedFieldPadding: {
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 2,
  },
  stackedLabel: {
    marginBottom: 8,
    color: brandColors.tanMuted,
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.35,
    ...(Platform.OS === 'android' ? { includeFontPadding: false } : {}),
  },
  groupedInput: {
    fontSize: 16,
    fontWeight: '500',
    color: brandColors.cream,
    paddingVertical: Platform.OS === 'android' ? 4 : 6,
    paddingHorizontal: 0,
    paddingBottom: 12,
    minHeight: 28,
    ...(Platform.OS === 'android' ? { includeFontPadding: false } : {}),
  },
  pickerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 14,
    gap: 10,
    minHeight: 56,
  },
  pickerTexts: {
    flex: 1,
    minWidth: 0,
    gap: 3,
  },
  pickerChevronWrap: {
    opacity: 0.4,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    paddingHorizontal: 14,
    gap: 12,
    minHeight: 54,
  },
  switchBody: {
    flex: 1,
    paddingRight: 8,
    fontWeight: '600',
    fontSize: 15,
    lineHeight: 20,
  },
  footerActions: {
    gap: 12,
    marginTop: 12,
    paddingBottom: 8,
  },
});

const styles = StyleSheet.create({
  afterHero: {
    marginTop: 2,
  },
});
