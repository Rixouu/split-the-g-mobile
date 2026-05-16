import { ScrollView, StyleSheet, View, type ScrollViewProps, type ViewStyle } from 'react-native';
import { SafeAreaView, type Edge } from 'react-native-safe-area-context';

import { SCREEN_EDGE_GUTTER } from '@/constants/layout';
import { colors, radii, spacing } from '@/constants/design-tokens';
import { brandColors } from '@/constants/theme';

/**
 * Pass as `edges={UNDER_STACK_HEADER_SAFE_AREA_EDGES}` when this screen is shown
 * under a native Stack header. The navigator already accounts for top safe area;
 * including `top` here doubles the spacer (most visible on notch devices).
 */
export const UNDER_STACK_HEADER_SAFE_AREA_EDGES: readonly Edge[] = ['bottom', 'left', 'right'];

export type ScreenProps = ScrollViewProps & {
  edges?: readonly Edge[];
};

export function Screen({ children, contentContainerStyle, edges, ...props }: ScreenProps) {
  return (
    <SafeAreaView style={styles.safeArea} {...(edges != null ? { edges } : {})}>
      <ScrollView
        {...props}
        contentContainerStyle={[styles.content, contentContainerStyle]}
        keyboardShouldPersistTaps="handled">
        {children}
      </ScrollView>
    </SafeAreaView>
  );
}

export function Card({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: ViewStyle;
}) {
  return <View style={[styles.card, style]}>{children}</View>;
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: brandColors.black,
  },
  content: {
    gap: spacing.sectionGap,
    paddingHorizontal: SCREEN_EDGE_GUTTER,
    paddingTop: spacing.md,
    paddingBottom: spacing.contentBottomInset,
  },
  card: {
    gap: spacing.cardInnerGap,
    borderWidth: 1,
    borderColor: colors.stroke.frame,
    borderRadius: radii.card,
    backgroundColor: colors.surface.card,
    padding: spacing.cardPadding,
  },
});
