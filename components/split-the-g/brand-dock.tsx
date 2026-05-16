import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import type { ReactNode } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

/**
 * Mirrors split-the-g `AppNavigation.tsx` mobile dock:
 * - FAB: `h-[3.85rem] w-[3.85rem]`, `top-0`, `-translate-y-[38%]` (center sits just below panel top edge, ~62% of circle above).
 * - Center gap: fixed width between Compete and Pubs for the FAB column.
 * Row: Feed | Compete · FAB · Pubs | Profile — icon + label per tab, vertically centered as a column.
 */
import PourNavIcon from '@/assets/icons/nav/pour.svg';
import { colors, layout, radii, shadows, spacing, typeScale } from '@/constants/design-tokens';
import { brandColors } from '@/constants/theme';
import { useLocale } from '@/lib/i18n/locale-context';

const FAB_SIZE = layout.dock.fabSize;
const FAB_OVERLAP_UP = FAB_SIZE * layout.dock.fabOverlapFactor;
const DOCK_CENTER_GAP = layout.dock.centerGap;
const POUR_FAB_GLYPH = layout.dock.pourGlyph;
const DOCK_TAB_ICON = layout.dock.tabIcon;

/**
 * With Android edge-to-edge (see app.json `edgeToEdgeEnabled`), OEMs occasionally
 * report `insets.bottom === 0` while a 3-button or gesture navigation bar still
 * steals touches. Without a minimum, the dock sits flush on the nav bar and taps
 * on Pubs/read-out look like hardware back/home.
 */
function triggerHaptic() {
  void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
}

/** Icon + label column; `renderIcon` receives tint so idle/active match the label. */
function DockTabIcon({
  active,
  label,
  onPress,
  renderIcon,
}: {
  active: boolean;
  label: string;
  onPress: () => void;
  renderIcon: (color: string) => ReactNode;
}) {
  const color = active ? colors.text.accent : colors.dock.iconIdle;
  return (
    <Pressable
      accessibilityRole="tab"
      accessibilityState={{ selected: active }}
      onPress={onPress}
      style={({ pressed }) => [styles.row1Item, pressed && styles.pressed]}>
      <View style={styles.dockTabInner}>
        {renderIcon(color)}
        <Text style={[styles.dockLabel, active ? styles.dockLabelActive : styles.dockLabelIdle]} numberOfLines={1}>
          {label}
        </Text>
      </View>
    </Pressable>
  );
}

export function BrandDockTabBar({ state, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const { t } = useLocale();

  const dockPaddingBottom =
    Platform.OS === 'android'
      ? Math.max(insets.bottom + layout.dock.paddingBottomAndroidExtra, layout.dock.paddingBottomAndroidMinTotal)
      : Math.max(insets.bottom, layout.dock.paddingBottomIos);

  const current = state.routes[state.index]?.name;

  function go(routeName: string) {
    triggerHaptic();
    navigation.navigate(routeName as never);
  }

  return (
    <View
      style={[styles.wrapper, { paddingBottom: dockPaddingBottom }]}
      accessibilityRole="tablist">
      <View style={styles.dockWrap}>
        <View style={styles.panel}>
          <View style={styles.row1}>
            <DockTabIcon
              active={current === 'feed'}
              label={t('navFeed')}
              onPress={() => go('feed')}
              renderIcon={(color) => <Ionicons name="albums-outline" size={DOCK_TAB_ICON} color={color} />}
            />
            <DockTabIcon
              active={current === 'compete'}
              label={t('navCompete')}
              onPress={() => go('compete')}
              renderIcon={(color) => <Ionicons name="trophy-outline" size={DOCK_TAB_ICON} color={color} />}
            />
            <View style={styles.row1Spacer} />
            <DockTabIcon
              active={current === 'pubs'}
              label={t('navPubs')}
              onPress={() => go('pubs')}
              renderIcon={(color) => (
                <MaterialCommunityIcons name="glass-mug-variant" size={DOCK_TAB_ICON} color={color} />
              )}
            />
            <DockTabIcon
              active={current === 'profile'}
              label={t('navProfile')}
              onPress={() => go('profile')}
              renderIcon={(color) => <Ionicons name="person-outline" size={DOCK_TAB_ICON} color={color} />}
            />
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
    left: spacing.dockHorizontalInset,
    right: spacing.dockHorizontalInset,
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
    borderRadius: radii.dockPanel,
    borderWidth: 1,
    borderColor: colors.stroke.default,
    backgroundColor: colors.dock.background,
    paddingTop: layout.dock.panelPaddingTop,
    paddingHorizontal: layout.dock.panelPaddingH,
    paddingBottom: layout.dock.panelPaddingBottom,
    ...shadows.dockPanel,
  },
  row1: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: layout.dock.rowMinHeight,
    paddingHorizontal: 2,
  },
  row1Item: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: layout.dock.rowMinHeight,
  },
  dockTabInner: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.dockTabIconGap,
  },
  row1Spacer: {
    width: DOCK_CENTER_GAP,
    flexShrink: 0,
  },
  dockLabel: {
    ...typeScale.dockLabel,
    includeFontPadding: false,
  },
  dockLabelActive: {
    color: colors.text.accent,
    borderBottomColor: colors.text.accent,
  },
  dockLabelIdle: {
    color: colors.dock.iconIdle,
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
    backgroundColor: colors.cta.primaryBg,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.dock.fabRingIdle,
    ...shadows.fab,
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
