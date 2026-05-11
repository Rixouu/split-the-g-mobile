import { Image, StyleSheet, View } from 'react-native';

import { brandColors } from '@/constants/theme';

interface PourGalleryProps {
  pintUrl: string | null | undefined;
  splitUrl: string | null | undefined;
  closeupUrl: string | null | undefined;
}

export function PourGallery({ pintUrl, splitUrl, closeupUrl }: PourGalleryProps) {
  return (
    <View style={styles.wrap}>
      {pintUrl ? <Image source={{ uri: pintUrl }} style={styles.main} accessibilityLabel="Pint" /> : null}
      {splitUrl ? <Image source={{ uri: splitUrl }} style={styles.secondary} accessibilityLabel="Split" /> : null}
      {closeupUrl ? (
        <Image source={{ uri: closeupUrl }} style={styles.secondary} accessibilityLabel="G close-up" />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: 12,
  },
  main: {
    width: '100%',
    height: 360,
    borderRadius: 24,
    backgroundColor: brandColors.panelMuted,
  },
  secondary: {
    width: '100%',
    height: 220,
    borderRadius: 18,
    backgroundColor: brandColors.panelMuted,
  },
});
