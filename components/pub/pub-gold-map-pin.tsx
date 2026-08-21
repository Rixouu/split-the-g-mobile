import { StyleSheet, Text, View } from 'react-native';

import { brandColors } from '@/constants/theme';

interface PubGoldMapPinProps {
  /** Detail map pin is slightly larger for visibility */
  variant?: 'list' | 'detail';
  /** A compact venue identifier shown on directory map markers. */
  label?: string;
  /** Makes the marker for the currently previewed pub easier to spot. */
  selected?: boolean;
}

function markerLabel(label?: string): string {
  const words = label?.trim().split(/\s+/).filter(Boolean) ?? [];
  if (words.length === 0) return 'PUB';
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return `${words[0][0] ?? ''}${words[1][0] ?? ''}`.toUpperCase();
}

export function PubGoldMapPin({ variant = 'list', label, selected = false }: PubGoldMapPinProps) {
  const isDetail = variant === 'detail';
  const ring = isDetail ? 26 : 20;
  const dot = isDetail ? 13 : 10;

  if (!isDetail && label) {
    return (
      <View collapsable={false} style={styles.markerWrap}>
        <View collapsable={false} style={[styles.directoryMarker, selected && styles.directoryMarkerSelected]}>
          <Text style={[styles.directoryMarkerLabel, selected && styles.directoryMarkerLabelSelected]}>
            {markerLabel(label)}
          </Text>
        </View>
        <View collapsable={false} style={[styles.markerTail, selected && styles.markerTailSelected]} />
      </View>
    );
  }

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
  markerWrap: {
    alignItems: 'center',
  },
  directoryMarker: {
    minWidth: 38,
    height: 38,
    paddingHorizontal: 7,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: brandColors.black,
    borderWidth: 2,
    borderColor: brandColors.goldBright,
    shadowColor: '#000000',
    shadowOpacity: 0.35,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  directoryMarkerSelected: {
    minWidth: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: brandColors.goldBright,
    borderColor: brandColors.cream,
  },
  directoryMarkerLabel: {
    color: brandColors.goldBright,
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.15,
  },
  directoryMarkerLabelSelected: {
    color: brandColors.black,
    fontSize: 13,
  },
  markerTail: {
    width: 0,
    height: 0,
    marginTop: -1,
    borderLeftWidth: 6,
    borderRightWidth: 6,
    borderTopWidth: 8,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: brandColors.goldBright,
  },
  markerTailSelected: {
    borderLeftWidth: 7,
    borderRightWidth: 7,
    borderTopWidth: 9,
    borderTopColor: brandColors.cream,
  },
});
