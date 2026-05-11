import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import * as Haptics from 'expo-haptics';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

/**
 * Mirrors split-the-g `AppNavigation.tsx` mobile dock:
 * - FAB: `h-[3.85rem] w-[3.85rem]`, `top-0`, `-translate-y-[38%]` (center sits just below panel top edge, ~62% of circle above).
 * - Center gap: `w-[4.5rem]` between Wall and Pubs.
 * Row 1: Feed | Wall · FAB · Pubs | Me (pour glyph only on FAB, like `nav-mask-icons.css`).
 */
import PourNavIcon from '@/assets/icons/nav/pour.svg';
import { brandColors } from '@/constants/theme';
import { useLocale } from '@/lib/i18n/locale-context';

/** Web `h-[3.85rem] w-[3.85rem]` at default 16px root ≈ 61.6 — round for RN layout. */
const FAB_SIZE = 62;
/** Web `-translate-y-[38%]` of FAB height — overlap above panel top. */
const FAB_OVERLAP_UP = FAB_SIZE * 0.38;
/** Web spacer `<li className="w-[4.5rem] shrink-0" />` between dock halves. */
const DOCK_CENTER_GAP = 72;
/** Web: `MobileNavIcon` pour uses `h-8 w-8` (32 CSS px). */
const POUR_FAB_GLYPH = 32;

const dockIconIdle = 'rgba(212, 183, 143, 0.45)';

function triggerHaptic() {
  void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
}

function DockLabel({
  children,
  active,
}: {
  children: string;
  active: boolean;
}) {
  return (
    <Text style={[styles.dockLabel, active ? styles.dockLabelActive : styles.dockLabelIdle]} numberOfLines={1}>
      {children}
    </Text>
  );
}

export function BrandDockTabBar({ state, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const { t } = useLocale();

  const current = state.routes[state.index]?.name;

  function go(routeName: string) {
    triggerHaptic();
    navigation.navigate(routeName as never);
  }

  return (
    <View
      style={[
        styles.wrapper,
        {
          paddingBottom: Math.max(insets.bottom, 10),
        },
      ]}
      accessibilityRole="tablist">
      <View style={styles.dockWrap}>
        <View style={styles.panel}>
          <View style={styles.row1}>
            <Pressable
              accessibilityRole="tab"
              accessibilityState={{ selected: current === 'feed' }}
              onPress={() => go('feed')}
              style={({ pressed }) => [styles.row1Item, pressed && styles.pressed]}>
              <DockLabel active={current === 'feed'}>{t('navFeed')}</DockLabel>
            </Pressable>
            <Pressable
              accessibilityRole="tab"
              accessibilityState={{ selected: current === 'wall' }}
              onPress={() => go('wall')}
              style={({ pressed }) => [styles.row1Item, pressed && styles.pressed]}>
              <DockLabel active={current === 'wall'}>{t('navWall')}</DockLabel>
            </Pressable>
            <View style={styles.row1Spacer} />
            <Pressable
              accessibilityRole="tab"
              accessibilityState={{ selected: current === 'pubs' }}
              onPress={() => go('pubs')}
              style={({ pressed }) => [styles.row1Item, pressed && styles.pressed]}>
              <DockLabel active={current === 'pubs'}>{t('navPubs')}</DockLabel>
            </Pressable>
            <Pressable
              accessibilityRole="tab"
              accessibilityState={{ selected: current === 'profile' }}
              onPress={() => go('profile')}
              style={({ pressed }) => [styles.row1Item, pressed && styles.pressed]}>
              <DockLabel active={current === 'profile'}>{t('navMe')}</DockLabel>
            </Pressable>
          </View>
        </View>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('navPour')}
          onPress={() => go('index')}
          style={({ pressed }) => [
            styles.fab,
            current === 'index' && styles.fabActiveRing,
            pressed && styles.fabPressed,
          ]}>
          <PourNavIcon width={POUR_FAB_GLYPH} height={POUR_FAB_GLYPH} accessibilityElementsHidden />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    left: 12,
    right: 12,
    bottom: 0,
    alignItems: 'center',
    overflow: 'visible',
  },
  dockWrap: {
    width: '100%',
    maxWidth: 440,
    position: 'relative',
    overflow: 'visible',
  },
  panel: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: brandColors.border,
    backgroundColor: brandColors.dockBackground,
    paddingTop: 12,
    paddingHorizontal: 4,
    paddingBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.45,
    shadowRadius: 24,
    elevation: 16,
  },
  row1: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    minHeight: 44,
    paddingHorizontal: 2,
  },
  row1Item: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingBottom: 6,
    minHeight: 44,
  },
  row1Spacer: {
    width: DOCK_CENTER_GAP,
  },
  dockLabel: {
    fontSize: 9,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    paddingBottom: 4,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
    textAlign: 'center',
  },
  dockLabelActive: {
    color: brandColors.gold,
    borderBottomColor: brandColors.gold,
  },
  dockLabelIdle: {
    color: dockIconIdle,
  },
  fab: {
    position: 'absolute',
    left: '50%',
    marginLeft: -FAB_SIZE / 2,
    /** Match web `top-0` + `-translate-y-[38%]`: anchor to panel top, shift up by 38% of FAB height. */
    top: -FAB_OVERLAP_UP,
    zIndex: 10,
    width: FAB_SIZE,
    height: FAB_SIZE,
    borderRadius: FAB_SIZE / 2,
    backgroundColor: brandColors.gold,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(11, 11, 11, 0.3)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.45,
    shadowRadius: 14,
    elevation: 14,
  },
  fabActiveRing: {
    borderWidth: 2,
    borderColor: brandColors.goldBright,
    shadowColor: brandColors.gold,
    shadowOpacity: 0.35,
  },
  fabPressed: {
    opacity: 0.92,
    transform: [{ scale: 0.97 }],
  },
  pressed: {
    opacity: 0.82,
  },
});
