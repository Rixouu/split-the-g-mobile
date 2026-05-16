import { MaterialCommunityIcons } from '@expo/vector-icons';
import type { ComponentProps } from 'react';
import { StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';

import { AppButton } from '@/components/split-the-g/button';
import { brandColors } from '@/constants/theme';

type IconName = ComponentProps<typeof MaterialCommunityIcons>['name'];

export interface PromotionSpotCardProps {
  /** Uppercase-style label (e.g. advertising placement name). */
  eyebrow: string;
  /** Supporting body copy. */
  description: string;
  /** Primary action label. */
  actionLabel: string;
  onActionPress: () => void;
  /** Accent icon from MaterialCommunityIcons. */
  iconName?: IconName;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

/**
 * Reusable promo / sponsorship callout — dark panel, gold frame, outlined CTA.
 * Use anywhere you need a consistent “ask about placements” style block.
 */
export function PromotionSpotCard({
  eyebrow,
  description,
  actionLabel,
  onActionPress,
  iconName = 'bullhorn-outline',
  style,
  testID,
}: PromotionSpotCardProps) {
  return (
    <View
      style={[styles.card, style]}
      testID={testID}
      accessibilityLabel={`${eyebrow}. ${description}`}>
      <View style={styles.accentTop} />
      <View style={styles.content}>
        <View style={styles.headerRow}>
          <View style={styles.iconBadge}>
            <MaterialCommunityIcons name={iconName} size={22} color={brandColors.goldBright} />
          </View>
          <Text style={styles.eyebrow}>{eyebrow}</Text>
        </View>
        <Text style={styles.description}>{description}</Text>
        <AppButton label={actionLabel} variant="secondary" fullWidth onPress={onActionPress} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(179, 139, 45, 0.38)',
    backgroundColor: 'rgba(29, 24, 15, 0.55)',
    overflow: 'hidden',
  },
  accentTop: {
    height: 4,
    width: '100%',
    backgroundColor: 'rgba(197, 160, 89, 0.9)',
  },
  content: {
    flex: 1,
    paddingVertical: 18,
    paddingHorizontal: 16,
    gap: 12,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconBadge: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(179, 139, 45, 0.35)',
    backgroundColor: 'rgba(11, 11, 11, 0.45)',
  },
  eyebrow: {
    flex: 1,
    color: brandColors.goldBright,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.6,
    textTransform: 'uppercase',
  },
  description: {
    color: 'rgba(244, 237, 220, 0.92)',
    fontSize: 15,
    lineHeight: 22,
    fontWeight: '500',
  },
});
