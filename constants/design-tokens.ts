/**
 * Semantic design tokens for Split the G mobile.
 * Raw brand palette stays in `./theme` (`brandColors`); map UI roles here for consistency.
 */

import type { TextStyle, ViewStyle } from 'react-native';

import { brandColors } from '@/constants/theme';

/** Horizontal inset for screens, lists, and scroll content — single gutter across tabs. */
export const SCREEN_EDGE_GUTTER = 20;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  screenGutter: SCREEN_EDGE_GUTTER,
  /** Vertical gap between major blocks inside `Screen` scroll content */
  sectionGap: 18,
  cardPadding: 18,
  cardInnerGap: 14,
  /** Space reserved above bottom dock */
  contentBottomInset: 132,
  dockHorizontalInset: 12,
  dockTabIconGap: 4,
} as const;

export const radii = {
  pill: 999,
  buttonRounded: 12,
  card: 14,
  dockPanel: 16,
  sm: 8,
  md: 12,
  lg: 14,
  orb: 18,
} as const;

/** Semantic colors derived from `brandColors`. */
export const colors = {
  text: {
    primary: brandColors.cream,
    /** Body secondary — matches typography `muted` baseline */
    muted: 'rgba(212, 183, 143, 0.72)',
    mutedStrong: 'rgba(212, 183, 143, 0.62)',
    mutedMedium: 'rgba(212, 183, 143, 0.55)',
    mutedWeak: 'rgba(212, 183, 143, 0.5)',
    accent: brandColors.gold,
    accentBright: brandColors.goldBright,
    onPrimary: brandColors.black,
  },
  surface: {
    panel: brandColors.panel,
    panelTranslucent: 'rgba(29, 24, 15, 0.35)',
    panelTranslucentSoft: 'rgba(29, 24, 15, 0.3)',
    inkTranslucent: 'rgba(11, 11, 11, 0.55)',
    inkTranslucentStrong: 'rgba(11, 11, 11, 0.72)',
    card: 'rgba(29, 24, 15, 0.35)',
    hubRow: 'rgba(29, 24, 15, 0.3)',
    hubIconWell: 'rgba(11, 11, 11, 0.4)',
    editButton: 'rgba(11, 11, 11, 0.45)',
    favOnTint: 'rgba(179, 139, 45, 0.14)',
  },
  stroke: {
    ctaSecondary: 'rgba(179, 139, 45, 0.42)',
    ctaSecondaryBold: 'rgba(179, 139, 45, 0.45)',
    outlineStrong: 'rgba(179, 139, 45, 0.45)',
    favActive: 'rgba(197, 160, 89, 0.55)',
    hub: brandColors.hubStroke,
    frame: brandColors.frame,
    subtle: brandColors.borderSubtle,
    default: brandColors.border,
  },
  cta: {
    primaryBg: brandColors.gold,
    primaryFg: brandColors.black,
    secondaryBg: brandColors.panel,
    secondaryFg: brandColors.gold,
    secondaryBorder: 'rgba(179, 139, 45, 0.42)',
    /** Outline-only secondary tier (transparent fill) */
    outlineFg: brandColors.gold,
    outlineBorder: 'rgba(179, 139, 45, 0.45)',
    outlineBorderWidth: 2,
    tertiaryFg: brandColors.gold,
    pressedOpacity: 0.88,
    disabledOpacity: 0.45,
  },
  dock: {
    background: brandColors.dockBackground,
    iconIdle: 'rgba(212, 183, 143, 0.45)',
    fabRingIdle: 'rgba(11, 11, 11, 0.3)',
  },
  tab: {
    underlineIdle: 'rgba(212, 183, 143, 0.45)',
  },
  chevron: {
    muted: 'rgba(179, 139, 45, 0.7)',
  },
} as const;

/** Typography scale — compose with `Platform`-specific tweaks (e.g. includeFontPadding) in components. */
export const typeScale = {
  overline: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.4,
    textTransform: 'uppercase',
    color: colors.text.mutedWeak,
  } satisfies TextStyle,
  /** Screen hero titles */
  title: {
    fontSize: 32,
    fontWeight: '800',
    lineHeight: 38,
    letterSpacing: -0.5,
    color: colors.text.primary,
  } satisfies TextStyle,
  /** Discover / feed headers — slightly smaller than hero `Title` */
  titleCompact: {
    fontSize: 28,
    fontWeight: '800',
    lineHeight: 34,
    letterSpacing: -0.45,
    color: colors.text.primary,
  } satisfies TextStyle,
  tagline: {
    fontSize: 16,
    fontWeight: '600',
    lineHeight: 22,
    letterSpacing: -0.2,
    color: colors.text.accent,
  } satisfies TextStyle,
  body: {
    fontSize: 16,
    lineHeight: 24,
    color: colors.text.primary,
  } satisfies TextStyle,
  bodySmall: {
    fontSize: 14,
    lineHeight: 21,
    color: colors.text.muted,
  } satisfies TextStyle,
  discoverMuted: {
    fontSize: 13,
    lineHeight: 18,
    marginTop: 2,
    color: colors.text.mutedStrong,
  } satisfies TextStyle,
  sectionTitle: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1.35,
    textTransform: 'uppercase',
    color: colors.text.accentBright,
    marginBottom: spacing.sm,
    opacity: 0.92,
  } satisfies TextStyle,
  dockLabel: {
    fontSize: 9,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    paddingBottom: 3,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
    textAlign: 'center',
  } satisfies TextStyle,
  underlineTab: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.65,
    textTransform: 'uppercase',
    textAlign: 'center',
    paddingBottom: 6,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  } satisfies TextStyle,
  buttonLabel: {
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 0.35,
  } satisfies TextStyle,
  pubSectionHeading: {
    color: colors.text.accentBright,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.6,
    textTransform: 'uppercase',
  } satisfies TextStyle,
  tertiaryLink: {
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.35,
    color: colors.cta.tertiaryFg,
    textDecorationLine: 'underline',
    textAlign: 'center',
  } satisfies TextStyle,
} as const;

export const layout = {
  buttonMinHeight: {
    pill: 52,
    rounded: 48,
  },
  buttonPaddingH: 20,
  dock: {
    fabSize: 62,
    fabOverlapFactor: 0.38,
    centerGap: 72,
    pourGlyph: 32,
    tabIcon: 20,
    panelPaddingTop: 12,
    panelPaddingH: 4,
    panelPaddingBottom: 8,
    rowMinHeight: 52,
    paddingBottomIos: 12,
    paddingBottomAndroidMinTotal: 40,
    paddingBottomAndroidExtra: 6,
  },
} as const;

export const shadows = {
  dockPanel: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.45,
    shadowRadius: 24,
    elevation: 16,
  } satisfies ViewStyle,
  fab: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.45,
    shadowRadius: 14,
    elevation: 14,
  } satisfies ViewStyle,
} as const;
