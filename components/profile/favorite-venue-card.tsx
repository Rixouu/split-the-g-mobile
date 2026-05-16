import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { brandColors } from '@/constants/theme';

/** Matches web `PUB_VENUE_CARD_STROKE` on pub-venue-card. */
const VENUE_STROKE = '#322914';

interface FavoriteVenueCardProps {
  title: string;
  address?: string | null;
  avgPourRating?: number | null;
  ratingCount: number;
  pourLabel: string;
  ratingOutOfLabel: string;
  ratingDotLabel: string;
  noRatingsLabel: string;
  mapsLabel: string;
  removeLabel: string;
  onPressPrimary: () => void;
  onPressMaps: () => void;
  onPressRemove: () => void;
  removeDisabled?: boolean;
  primaryDisabled?: boolean;
}

export function FavoriteVenueCard({
  title,
  address,
  avgPourRating,
  ratingCount,
  pourLabel,
  ratingOutOfLabel,
  ratingDotLabel,
  noRatingsLabel,
  mapsLabel,
  removeLabel,
  onPressPrimary,
  onPressMaps,
  onPressRemove,
  removeDisabled,
  primaryDisabled,
}: FavoriteVenueCardProps) {
  const hasRating =
    ratingCount > 0 && avgPourRating != null && Number.isFinite(avgPourRating);

  return (
    <View style={styles.card}>
      <Pressable
        onPress={onPressPrimary}
        disabled={primaryDisabled}
        style={({ pressed }) => [
          styles.mainTap,
          pressed && !primaryDisabled && styles.mainTapPressed,
          primaryDisabled && styles.mainTapDisabled,
        ]}
        accessibilityRole="button">
        <View style={styles.iconWrap}>
          <MaterialCommunityIcons name="map-marker-outline" size={28} color={brandColors.gold} />
        </View>
        <View style={styles.body}>
          <View style={styles.titleRow}>
            <Text style={styles.title} numberOfLines={2}>
              {title}
            </Text>
            <MaterialCommunityIcons name="chevron-right" size={22} color="rgba(179, 139, 45, 0.45)" />
          </View>
          {address ? (
            <Text style={styles.address} numberOfLines={2}>
              {address}
            </Text>
          ) : null}
          <View style={styles.pills}>
            <View style={styles.pill}>
              <MaterialCommunityIcons name="glass-pint-outline" size={16} color="rgba(179, 139, 45, 0.85)" />
              <Text style={styles.pillText}>{pourLabel}</Text>
            </View>
            {hasRating ? (
              <View style={styles.pill}>
                <MaterialCommunityIcons name="star" size={14} color={brandColors.gold} />
                <Text style={styles.ratingGold}>{avgPourRating!.toFixed(1)}</Text>
                <Text style={styles.ratingMuted}>{ratingOutOfLabel}</Text>
                <Text style={styles.ratingDot}>{ratingDotLabel}</Text>
              </View>
            ) : (
              <View style={[styles.pill, styles.pillDashed]}>
                <Text style={styles.noRatings}>{noRatingsLabel}</Text>
              </View>
            )}
          </View>
        </View>
      </Pressable>

      <View style={styles.actions}>
        <Pressable
          onPress={onPressMaps}
          style={({ pressed }) => [styles.actionOutline, pressed && styles.actionPressed]}
          accessibilityRole="button">
          <Text style={styles.actionOutlineLabel}>{mapsLabel}</Text>
        </Pressable>
        <Pressable
          onPress={onPressRemove}
          disabled={removeDisabled}
          style={({ pressed }) => [
            styles.actionDanger,
            removeDisabled && styles.actionDisabled,
            pressed && !removeDisabled && styles.actionPressed,
          ]}
          accessibilityRole="button">
          <Text style={styles.actionDangerLabel}>{removeLabel}</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: VENUE_STROKE,
    backgroundColor: 'rgba(29, 24, 15, 0.42)',
    overflow: 'hidden',
  },
  mainTap: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  mainTapPressed: {
    opacity: 0.92,
  },
  mainTapDisabled: {
    opacity: 0.55,
  },
  iconWrap: {
    width: 56,
    height: 56,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: VENUE_STROKE,
    backgroundColor: 'rgba(179, 139, 45, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: {
    flex: 1,
    minWidth: 0,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 8,
  },
  title: {
    flex: 1,
    color: brandColors.gold,
    fontSize: 18,
    fontWeight: '700',
    lineHeight: 24,
  },
  address: {
    marginTop: 4,
    color: 'rgba(212, 183, 143, 0.65)',
    fontSize: 13,
    lineHeight: 19,
  },
  pills: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 12,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: VENUE_STROKE,
    backgroundColor: 'rgba(11, 11, 11, 0.45)',
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  pillDashed: {
    borderStyle: 'dashed',
    backgroundColor: 'rgba(11, 11, 11, 0.25)',
  },
  pillText: {
    color: 'rgba(212, 183, 143, 0.9)',
    fontSize: 12,
    fontWeight: '600',
  },
  ratingGold: {
    color: brandColors.gold,
    fontSize: 12,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  ratingMuted: {
    color: 'rgba(212, 183, 143, 0.55)',
    fontSize: 12,
    fontWeight: '600',
  },
  ratingDot: {
    color: 'rgba(212, 183, 143, 0.45)',
    fontSize: 12,
    fontWeight: '500',
  },
  noRatings: {
    color: 'rgba(212, 183, 143, 0.5)',
    fontSize: 12,
    fontWeight: '500',
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 16,
    paddingTop: 4,
    paddingBottom: 14,
    borderTopWidth: 1,
    borderTopColor: VENUE_STROKE,
  },
  actionOutline: {
    flex: 1,
    minHeight: 40,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: VENUE_STROKE,
    backgroundColor: 'rgba(11, 11, 11, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 10,
  },
  actionDanger: {
    flex: 1,
    minHeight: 40,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(248, 113, 113, 0.45)',
    backgroundColor: 'rgba(11, 11, 11, 0.35)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 10,
  },
  actionOutlineLabel: {
    color: brandColors.gold,
    fontSize: 12,
    fontWeight: '700',
  },
  actionDangerLabel: {
    color: 'rgba(248, 113, 113, 0.95)',
    fontSize: 12,
    fontWeight: '700',
  },
  actionPressed: {
    opacity: 0.88,
  },
  actionDisabled: {
    opacity: 0.45,
  },
});
