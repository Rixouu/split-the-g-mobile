import { ScrollView, StyleSheet, View, type ScrollViewProps } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { SCREEN_EDGE_GUTTER } from '@/constants/layout';
import { brandColors } from '@/constants/theme';

const CARD_RADIUS = 14;

export function Screen({ children, contentContainerStyle, ...props }: ScrollViewProps) {
  return (
    <SafeAreaView style={styles.safeArea}>
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
