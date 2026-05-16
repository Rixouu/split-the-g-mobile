import { ActivityIndicator, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { Muted, Title } from '@/components/split-the-g/typography';
import { spacing } from '@/constants/design-tokens';
import { brandColors } from '@/constants/theme';
import { useLocale } from '@/lib/i18n/locale-context';

export interface ScreenLoadingBlockProps {
  /** Defaults to `commonLoading` when captions are shown */
  label?: string;
  /** Second line (e.g. full-screen pour analysis) */
  subtitle?: string;
  /** When false, only the spinner is shown (e.g. map mount, camera capture). */
  showCaption?: boolean;
  /** VoiceOver / TalkBack label when captions are hidden, or override full announcement */
  accessibilityLabel?: string;
  /** `title` uses screen `Title` typography; `muted` uses `Muted` (default). */
  primaryVariant?: 'muted' | 'title';
  indicatorSize?: 'small' | 'large';
  /** Column: spinner above caption. Row: inline for dense areas (e.g. tab bodies). */
  layout?: 'column' | 'row';
  /** Horizontal alignment for column layout */
  contentAlign?: 'center' | 'start';
  /** Tighter vertical padding for nested hints */
  dense?: boolean;
  style?: StyleProp<ViewStyle>;
}

export function ScreenLoadingBlock({
  label: labelProp,
  subtitle,
  showCaption = true,
  accessibilityLabel: accessibilityLabelProp,
  primaryVariant = 'muted',
  indicatorSize = 'large',
  layout = 'column',
  contentAlign = 'center',
  dense = false,
  style,
}: ScreenLoadingBlockProps) {
  const { t } = useLocale();
  const primaryText = labelProp ?? t('commonLoading');
  const verticalPad = dense ? spacing.md : spacing.lg;

  const resolvedA11y =
    accessibilityLabelProp ??
    (showCaption ? [primaryText, subtitle].filter(Boolean).join('. ') : t('commonLoading'));

  const captionTextStyle = [
    layout === 'row' ? styles.captionRow : null,
    layout === 'column' && contentAlign === 'start' ? styles.captionStart : styles.captionCenter,
  ];

  return (
    <View
      style={[
        layout === 'column' ? styles.column : styles.row,
        layout === 'column' && contentAlign === 'start' ? styles.colStart : null,
        { paddingVertical: verticalPad },
        style,
      ]}
      accessibilityRole="progressbar"
      accessibilityLabel={resolvedA11y}>
      <ActivityIndicator
        color={brandColors.goldBright}
        size={indicatorSize === 'large' ? 'large' : 'small'}
      />
      {showCaption ? (
        primaryVariant === 'title' ? (
          <Title style={captionTextStyle}>{primaryText}</Title>
        ) : (
          <Muted style={captionTextStyle}>{primaryText}</Muted>
        )
      ) : null}
      {showCaption && subtitle ? (
        <Muted style={[styles.subtitle, layout === 'column' ? styles.captionCenter : styles.captionStart]}>
          {subtitle}
        </Muted>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  column: {
    alignItems: 'center',
    gap: spacing.sm,
  },
  colStart: {
    alignItems: 'flex-start',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    gap: spacing.md,
  },
  captionCenter: {
    textAlign: 'center',
  },
  captionStart: {
    textAlign: 'left',
  },
  captionRow: {
    flex: 1,
    textAlign: 'left',
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 20,
  },
});
