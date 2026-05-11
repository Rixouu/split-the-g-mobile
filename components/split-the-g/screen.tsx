import { ScrollView, StyleSheet, View, type ScrollViewProps } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { brandColors } from '@/constants/theme';

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
    padding: 20,
    paddingBottom: 120,
  },
  card: {
    gap: 12,
    borderWidth: 1,
    borderColor: brandColors.border,
    borderRadius: 24,
    backgroundColor: brandColors.panel,
    padding: 18,
  },
});
