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
const DOCK_TAB_ICON = 20;

/**
 * With Android edge-to-edge (see app.json `edgeToEdgeEnabled`), OEMs occasionally
 * report `insets.bottom === 0` while a 3-button or gesture navigation bar still
 * steals touches. Without a minimum, the dock sits flush on the nav bar and taps
 * on Pubs/read-out look like hardware back/home.
 */
const DOCK_PADDING_BOTTOM_IOS = 12;
const DOCK_PADDING_BOTTOM_ANDROID_MIN_TOTAL = 40;

const dockIconIdle = 'rgba(212, 183, 143, 0.45)';

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
  const color = active ? brandColors.gold : dockIconIdle;
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
      ? Math.max(insets.bottom + 6, DOCK_PADDING_BOTTOM_ANDROID_MIN_TOTAL)
      : Math.max(insets.bottom, DOCK_PADDING_BOTTOM_IOS);

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
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 52,
    paddingHorizontal: 2,
  },
  row1Item: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 52,
  },
  dockTabInner: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  row1Spacer: {
    width: DOCK_CENTER_GAP,
    flexShrink: 0,
  },
  dockLabel: {
    fontSize: 9,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    paddingBottom: 3,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
    textAlign: 'center',
    includeFontPadding: false,
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
