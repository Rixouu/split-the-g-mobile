import { useEffect, useRef, type PropsWithChildren } from 'react';
import { AccessibilityInfo, Animated, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { colors, radii, spacing } from '@/constants/design-tokens';
import { useLocale } from '@/lib/i18n/locale-context';

export function SkeletonBlock({ width = '100%', height = 16, style }: {
  width?: ViewStyle['width'];
  height?: number;
  style?: StyleProp<ViewStyle>;
}) {
  return <View style={[styles.block, { width, height }, style]} />;
}

function SkeletonGroup({ children, label }: PropsWithChildren<{ label?: string }>) {
  const { t } = useLocale();
  const opacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    let mounted = true;
    let animation: Animated.CompositeAnimation | undefined;
    const updateMotion = (reduceMotion: boolean) => {
      if (!mounted) return;
      animation?.stop();
      opacity.setValue(1);
      if (!reduceMotion) {
        animation = Animated.loop(Animated.sequence([
          Animated.timing(opacity, { toValue: 0.55, duration: 850, useNativeDriver: true, isInteraction: false }),
          Animated.timing(opacity, { toValue: 1, duration: 850, useNativeDriver: true, isInteraction: false }),
        ]));
        animation.start();
      }
    };
    const subscription = AccessibilityInfo.addEventListener('reduceMotionChanged', updateMotion);
    void AccessibilityInfo.isReduceMotionEnabled().then(updateMotion).catch(() => {});
    return () => {
      mounted = false;
      subscription.remove();
      animation?.stop();
    };
  }, [opacity]);

  return (
    <View accessible accessibilityRole="progressbar" accessibilityLabel={label ?? t('commonLoading')} accessibilityState={{ busy: true }}>
      <Animated.View style={[styles.stack, { opacity }]} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
        {children}
      </Animated.View>
    </View>
  );
}

function StatPlaceholders() {
  return (
    <View style={styles.row}>
      {[0, 1, 2].map((i) => (
        <View key={i} style={[styles.card, styles.cell]}>
          <SkeletonBlock width={28} height={26} />
          <SkeletonBlock width="75%" height={12} />
        </View>
      ))}
    </View>
  );
}

export function ListSkeleton({ count = 3, label }: { count?: number; label?: string }) {
  return (
    <SkeletonGroup label={label}>
      {Array.from({ length: count }, (_, i) => (
        <View key={i} style={styles.card}>
          <View style={styles.row}>
            <SkeletonBlock width={52} height={52} style={styles.icon} />
            <View style={[styles.stack, styles.cell]}>
              <SkeletonBlock width="65%" height={18} />
              <SkeletonBlock width="90%" height={12} />
            </View>
          </View>
          <SkeletonBlock height={12} />
          <SkeletonBlock width="65%" height={12} />
        </View>
      ))}
    </SkeletonGroup>
  );
}

export function NotebookSkeleton() {
  return (
    <SkeletonGroup label="Opening your Notebook…">
      <StatPlaceholders />
      <View style={styles.card}>
        <SkeletonBlock height={42} />
        <SkeletonBlock height={30} width="80%" />
      </View>
      {[0, 1, 2].map((i) => (
        <View key={i} style={styles.card}>
          <View style={styles.row}>
            <SkeletonBlock width={54} height={54} style={styles.icon} />
            <View style={[styles.stack, styles.cell]}>
              <SkeletonBlock width="50%" height={22} />
              <SkeletonBlock width="85%" height={20} />
              <SkeletonBlock height={12} />
            </View>
          </View>
          <SkeletonBlock height={12} />
          <SkeletonBlock width="75%" height={12} />
          <SkeletonBlock width="60%" height={28} />
        </View>
      ))}
    </SkeletonGroup>
  );
}

export function PourGridSkeleton() {
  return (
    <SkeletonGroup>
      {[0, 1].map((row) => (
        <View key={row} style={styles.row}>
          {[0, 1].map((col) => (
            <View key={col} style={[styles.gridCard, styles.cell]}>
              <View style={styles.image} />
              <View style={styles.cardCopy}>
                <SkeletonBlock width="65%" height={18} />
                <SkeletonBlock height={12} />
              </View>
            </View>
          ))}
        </View>
      ))}
    </SkeletonGroup>
  );
}

export function ProfileSkeleton() {
  return (
    <SkeletonGroup>
      <View style={styles.card}>
        <View style={styles.row}>
          <SkeletonBlock width={64} height={64} style={styles.avatar} />
          <View style={[styles.stack, styles.cell]}>
            <SkeletonBlock width="75%" height={24} />
            <SkeletonBlock width="50%" height={14} />
          </View>
        </View>
      </View>
      <StatPlaceholders />
      <SkeletonBlock height={48} />
      {[0, 1, 2].map((i) => (
        <View key={i} style={styles.card}>
          <SkeletonBlock width="65%" height={18} />
          <SkeletonBlock width="90%" height={12} />
        </View>
      ))}
    </SkeletonGroup>
  );
}

const styles = StyleSheet.create({
  stack: { gap: spacing.lg },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  cell: { flex: 1 },
  block: { borderRadius: radii.sm, backgroundColor: 'rgba(212, 183, 143, 0.13)' },
  card: { backgroundColor: colors.surface.card, borderColor: colors.stroke.hub, borderWidth: 1, borderRadius: radii.card, padding: spacing.cardPadding, gap: spacing.md },
  icon: { borderRadius: radii.card },
  avatar: { borderRadius: radii.pill },
  gridCard: { overflow: 'hidden', borderWidth: 1, borderColor: colors.stroke.hub, borderRadius: radii.card, backgroundColor: colors.surface.card },
  image: { aspectRatio: 1, backgroundColor: 'rgba(212, 183, 143, 0.13)' },
  cardCopy: { padding: spacing.md, gap: spacing.sm },
});
