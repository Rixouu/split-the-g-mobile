import { ScrollView, StyleSheet, View, type ScrollViewProps } from 'react-native';
import { SafeAreaView, type Edge } from 'react-native-safe-area-context';

import { SCREEN_EDGE_GUTTER } from '@/constants/layout';
import { brandColors } from '@/constants/theme';

const CARD_RADIUS = 14;

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

export function Card({ children }: { children: React.ReactNode }) {
  return <View style={styles.card}>{children}</View>;
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: brandColors.black,
  },
  content: {
    gap: 18,
    paddingHorizontal: SCREEN_EDGE_GUTTER,
    paddingTop: 12,
    paddingBottom: 132,
  },
  card: {
    gap: 14,
    borderWidth: 1,
    borderColor: brandColors.frame,
    borderRadius: CARD_RADIUS,
    backgroundColor: 'rgba(29, 24, 15, 0.35)',
    padding: 18,
  },
});
