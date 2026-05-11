import { Platform } from 'react-native';

/** Split-the-g web palette — tailwind `guinness.*` ([split-the-g/tailwind.config.ts](https://github.com/Rixouu/split-the-g)). */
export const brandColors = {
  black: '#0B0B0B',
  ink: '#0B0B0B',
  brown: '#1D180F',
  panel: '#1D180F',
  panelMuted: '#1D180F',
  cream: '#FDFBF3',
  muted: '#D4B78F',
  tanMuted: 'rgba(212, 183, 143, 0.68)',
  gold: '#B38B2D',
  goldBright: '#C5A059',
  frame: '#332B13',
  green: '#0B5B37',
  red: '#D84A3A',
  border: 'rgba(179, 139, 45, 0.28)',
  borderSubtle: 'rgba(179, 139, 45, 0.15)',
  dockBackground: 'rgba(29, 24, 15, 0.95)',
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
    sans: 'system-ui',
    serif: 'ui-serif',
    rounded: 'ui-rounded',
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
