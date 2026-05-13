import * as Haptics from 'expo-haptics';
import { Fragment, type ReactElement } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { brandColors } from '@/constants/theme';

export interface UnderlineTabItem<K extends string> {
  key: K;
  label: string;
}

interface UnderlineTabRowProps<K extends string> {
  tabs: readonly UnderlineTabItem<K>[];
  active: K;
  onChange: (key: K) => void;
}

/** Match `BrandDockTabBar` + Feed discover tabs — gold underline, no bordered pill switcher. */
export function UnderlineTabRow<K extends string>({
  tabs,
  active,
  onChange,
}: UnderlineTabRowProps<K>): ReactElement {
  return (
    <Fragment>
      <View style={styles.row}>
        {tabs.map(({ key, label }) => {
          const isActive = active === key;
          return (
            <Pressable
              key={key}
              onPress={() => {
                if (!isActive) {
                  void Haptics.selectionAsync();
                  onChange(key);
                }
              }}
              style={({ pressed }) => [styles.hit, pressed && styles.hitPressed]}
              accessibilityRole="tab"
              accessibilityState={{ selected: isActive }}>
              <Text
                style={[styles.label, isActive ? styles.labelActive : styles.labelIdle]}
                numberOfLines={1}>
                {label}
              </Text>
            </Pressable>
          );
        })}
      </View>
      <View style={styles.hairline} />
    </Fragment>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'stretch',
    justifyContent: 'center',
    gap: 36,
  },
  hairline: {
    marginTop: 10,
    height: StyleSheet.hairlineWidth,
    backgroundColor: brandColors.borderSubtle,
  },
  hit: {
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 96,
    paddingVertical: 4,
    paddingHorizontal: 10,
  },
  hitPressed: {
    opacity: 0.82,
  },
  label: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.65,
    textTransform: 'uppercase',
    textAlign: 'center',
    paddingBottom: 6,
    borderBottomWidth: 2,
  },
  labelActive: {
    color: brandColors.gold,
    borderBottomColor: brandColors.gold,
  },
  labelIdle: {
    color: 'rgba(212, 183, 143, 0.45)',
    borderBottomColor: 'transparent',
  },
});
