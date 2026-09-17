import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, radii, spacing } from '@/constants/design-tokens';
import { brandColors } from '@/constants/theme';
import type { NotebookPlace } from '@/lib/pub/notebook';

type Props = {
  place: NotebookPlace;
  pubKey?: string;
  routeResolving?: boolean;
  removing?: boolean;
  onOpenPub: () => void;
  onEdit: () => void;
  onDirections: () => void;
  onRemove: () => void;
};

function initials(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (!words.length) return 'P';
  return words.slice(0, 2).map((word) => word[0]?.toUpperCase()).join('');
}

function Action({
  icon,
  label,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      hitSlop={6}
      onPress={() => {
        void Haptics.selectionAsync();
        onPress();
      }}
      style={({ pressed }) => [styles.action, pressed && styles.pressed]}>
      <Ionicons name={icon} size={17} color={colors.text.accentBright} />
      <Text style={styles.actionLabel}>{label}</Text>
    </Pressable>
  );
}

export function NotebookPlaceCard({
  place,
  pubKey,
  routeResolving,
  removing,
  onOpenPub,
  onEdit,
  onDirections,
  onRemove,
}: Props) {
  const visited = place.note?.status === 'visited';
  const cardBody = (
    <>
      <View style={styles.topRow}>
        <View style={styles.initialWell}>
          <Text style={styles.initials}>{initials(place.bar_name)}</Text>
        </View>
        <View style={styles.titleWrap}>
          <View style={styles.badgeRow}>
            <View style={[styles.statusBadge, visited && styles.visitedBadge]}>
              <Ionicons
                name={visited ? 'checkmark-circle' : 'bookmark'}
                size={12}
                color={visited ? brandColors.cream : colors.text.accentBright}
              />
              <Text style={[styles.statusText, visited && styles.visitedText]}>
                {visited ? 'Visited' : 'Want to visit'}
              </Text>
            </View>
            {!routeResolving && !pubKey ? (
              <View style={styles.personalBadge}>
                <Ionicons name="lock-closed" size={10} color={colors.text.muted} />
                <Text style={styles.personalText}>Personal place</Text>
              </View>
            ) : null}
          </View>
          <Text style={styles.title}>{place.bar_name}</Text>
          {place.bar_address ? (
            <View style={styles.addressRow}>
              <Ionicons name="location-outline" size={14} color={colors.text.mutedStrong} />
              <Text style={styles.address} numberOfLines={2}>{place.bar_address}</Text>
            </View>
          ) : null}
        </View>
        {pubKey ? <Ionicons name="chevron-forward" size={21} color={colors.chevron.muted} /> : null}
      </View>

      {place.note?.tags.length ? (
        <View style={styles.tags}>
          {place.note.tags.map((tag) => (
            <View key={tag} style={styles.tag}>
              <Text style={styles.tagText}>{tag}</Text>
            </View>
          ))}
        </View>
      ) : null}

      <View style={styles.noteRow}>
        <Ionicons name="document-text-outline" size={16} color={colors.text.accentBright} />
        <Text style={place.note?.notes ? styles.note : styles.noteEmpty} numberOfLines={3}>
          {place.note?.notes || 'Add a private note about the atmosphere, food, access, or what to remember.'}
        </Text>
      </View>

      {pubKey ? (
        <View style={styles.openHint}>
          <Text style={styles.openHintText}>Open pub details</Text>
          <Ionicons name="arrow-forward" size={15} color={colors.text.accentBright} />
        </View>
      ) : routeResolving ? (
        <View style={styles.openHint}>
          <Text style={styles.resolvingText}>Checking venue details…</Text>
        </View>
      ) : null}
    </>
  );

  return (
    <View style={styles.card}>
      {pubKey ? (
        <Pressable
          accessibilityRole="link"
          accessibilityLabel={`Open pub details for ${place.bar_name}`}
          onPress={() => {
            void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            onOpenPub();
          }}
          style={({ pressed }) => [styles.body, pressed && styles.pressed]}>
          {cardBody}
        </Pressable>
      ) : (
        <View style={styles.body}>{cardBody}</View>
      )}

      <View style={styles.divider} />
      <View style={styles.actions}>
        <Action icon="create-outline" label={place.note ? 'Edit note' : 'Add note'} onPress={onEdit} />
        <View style={styles.actionDivider} />
        <Action icon="navigate-outline" label="Directions" onPress={onDirections} />
        <View style={styles.actionSpacer} />
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Remove ${place.bar_name} from Notebook`}
          disabled={removing}
          hitSlop={10}
          onPress={onRemove}
          style={({ pressed }) => [styles.removeButton, removing && styles.disabled, pressed && styles.pressed]}>
          <Ionicons name="trash-outline" size={18} color={colors.text.mutedStrong} />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.stroke.hub,
    borderRadius: radii.card,
    backgroundColor: colors.surface.card,
  },
  body: {
    gap: 15,
    padding: spacing.cardPadding,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 13,
  },
  initialWell: {
    width: 54,
    height: 54,
    flexShrink: 0,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.stroke.outlineStrong,
    borderRadius: 15,
    backgroundColor: colors.surface.hubIconWell,
  },
  initials: {
    color: colors.text.accentBright,
    fontSize: 17,
    fontWeight: '900',
    letterSpacing: 0.35,
  },
  titleWrap: {
    flex: 1,
    minWidth: 0,
    gap: 6,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: colors.stroke.ctaSecondary,
    borderRadius: radii.pill,
    backgroundColor: colors.surface.favOnTint,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  visitedBadge: {
    borderColor: 'rgba(11, 91, 55, 0.85)',
    backgroundColor: 'rgba(11, 91, 55, 0.7)',
  },
  statusText: {
    color: colors.text.accentBright,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.45,
    textTransform: 'uppercase',
  },
  visitedText: { color: brandColors.cream },
  personalBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 6,
    paddingVertical: 4,
  },
  personalText: {
    color: colors.text.muted,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.25,
  },
  title: {
    color: colors.text.primary,
    fontSize: 18,
    lineHeight: 22,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 5,
  },
  address: {
    flex: 1,
    color: colors.text.mutedStrong,
    fontSize: 13,
    lineHeight: 18,
  },
  tags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 7,
  },
  tag: {
    borderWidth: 1,
    borderColor: colors.stroke.subtle,
    borderRadius: radii.pill,
    backgroundColor: colors.surface.inkTranslucent,
    paddingHorizontal: 9,
    paddingVertical: 5,
  },
  tagText: {
    color: colors.text.muted,
    fontSize: 11,
    fontWeight: '700',
  },
  noteRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 9,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.stroke.subtle,
    paddingTop: 13,
  },
  note: {
    flex: 1,
    color: colors.text.primary,
    fontSize: 14,
    lineHeight: 20,
  },
  noteEmpty: {
    flex: 1,
    color: colors.text.muted,
    fontSize: 13,
    lineHeight: 19,
    fontStyle: 'italic',
  },
  openHint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
  },
  openHintText: {
    color: colors.text.accentBright,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  resolvingText: {
    color: colors.text.mutedMedium,
    fontSize: 12,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.stroke.subtle,
  },
  actions: {
    minHeight: 52,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
  },
  action: {
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    paddingHorizontal: 9,
  },
  actionLabel: {
    color: colors.text.primary,
    fontSize: 12,
    fontWeight: '800',
  },
  actionDivider: {
    width: StyleSheet.hairlineWidth,
    height: 21,
    backgroundColor: colors.stroke.subtle,
  },
  actionSpacer: { flex: 1 },
  removeButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radii.pill,
  },
  pressed: { opacity: 0.72 },
  disabled: { opacity: 0.4 },
});
