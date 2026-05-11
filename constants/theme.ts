import { Platform } from 'react-native';

export const brandColors = {
  black: '#050608',
  ink: '#0B0D10',
  panel: '#111318',
  panelMuted: '#181B22',
  cream: '#F8F1DE',
  muted: '#B9AD91',
  gold: '#D4AF37',
  goldBright: '#F5D56E',
  green: '#0B5B37',
  red: '#D84A3A',
  border: 'rgba(212, 175, 55, 0.24)',
};

export const Colors = {
  light: {
    text: brandColors.cream,
    background: brandColors.black,
    tint: brandColors.gold,
    icon: brandColors.muted,
    tabIconDefault: brandColors.muted,
    tabIconSelected: brandColors.gold,
  },
  dark: {
    text: brandColors.cream,
    background: brandColors.black,
    tint: brandColors.gold,
    icon: brandColors.muted,
    tabIconDefault: brandColors.muted,
    tabIconSelected: brandColors.gold,
  },
};

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded: "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});
