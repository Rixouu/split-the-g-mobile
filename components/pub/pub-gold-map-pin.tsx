import { StyleSheet, View } from 'react-native';

import { brandColors } from '@/constants/theme';

interface PubGoldMapPinProps {
  /** Detail map pin is slightly larger for visibility */
  variant?: 'list' | 'detail';
}

export function PubGoldMapPin({ variant = 'list' }: PubGoldMapPinProps) {
  const isDetail = variant === 'detail';
  const ring = isDetail ? 26 : 20;
  const dot = isDetail ? 13 : 10;
  return (
    <View collapsable={false} style={[styles.ring, { width: ring, height: ring, borderRadius: ring / 2 }]}>
      <View
        collapsable={false}
        style={[styles.dot, { width: dot, height: dot, borderRadius: dot / 2 }]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  ring: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(11, 11, 11, 0.55)',
    borderWidth: 2,
    borderColor: brandColors.goldBright,
  },
  dot: {
    backgroundColor: brandColors.goldBright,
  },
});
