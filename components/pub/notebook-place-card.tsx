import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, radii, spacing } from '@/constants/design-tokens';
import type { NotebookPlace } from '@/lib/pub/notebook';
import { SkeletonBlock } from '@/components/split-the-g/loading-skeleton';

type Props = {
  place: NotebookPlace;
  pubKey?: string;
  notesLoading?: boolean;
  notesUnavailable?: boolean;
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
  disabled = false,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
  disabled?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled }}
      disabled={disabled}
      hitSlop={6}
      onPress={() => {
        void Haptics.selectionAsync();
        onPress();
      }}
      style={({ pressed }) => [styles.action, disabled && styles.disabled, pressed && styles.pressed]}>
      <Ionicons name={icon} size={17} color={colors.text.accentBright} />
      <Text numberOfLines={1} style={styles.actionLabel}>{label}</Text>
    </Pressable>
  );
}

export function NotebookPlaceCard({
  place,
  pubKey,
  notesLoading = false,
  notesUnavailable = false,
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
          <Text style={styles.title}>{place.bar_name}</Text>
          {place.bar_address ? (
            <Text style={styles.address} numberOfLines={2}>{place.bar_address}</Text>
          ) : null}
          {notesLoading ? <SkeletonBlock width={75} height={12} /> : notesUnavailable ? (
            <Text style={styles.address}>Notes unavailable</Text>
          ) : <View style={styles.statusRow}>
            <Ionicons name={visited ? 'checkmark' : 'bookmark-outline'} size={12} color={colors.text.accentBright} />
            <Text style={styles.statusText}>{visited ? 'Visited' : 'To visit'}</Text>
          </View>}
        </View>
        {pubKey ? <Ionicons name="chevron-forward" size={21} color={colors.chevron.muted} /> : null}
      </View>

      {notesLoading ? (
        <View accessibilityRole="progressbar" accessibilityLabel="Loading private note" style={{ gap: spacing.sm }}>
          <SkeletonBlock height={12} />
          <SkeletonBlock width="75%" height={12} />
        </View>
      ) : <View style={styles.noteRow}>
        <Text style={place.note?.notes ? styles.note : styles.noteEmpty} numberOfLines={2}>
          {notesUnavailable ? 'Your note could not be loaded. Pull down to retry.' : place.note?.notes || 'Add a private note for your next visit.'}
        </Text>
      </View>}
      {place.note?.tags.length ? (
        <Text style={styles.tags} numberOfLines={2}>{place.note.tags.join(' · ')}</Text>
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
        <Action icon="create-outline" label={notesLoading ? 'Loading note…' : notesUnavailable ? 'Note unavailable' : place.note ? 'Edit note' : 'Add note'} disabled={notesLoading || notesUnavailable || removing} onPress={onEdit} />
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
    borderColor: colors.stroke.frame,
    borderRadius: radii.card,
    backgroundColor: colors.surface.card,
  },
  body: {
    gap: 14,
    padding: spacing.lg,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 11,
  },
  initialWell: {
    width: 48,
    height: 48,
    flexShrink: 0,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.stroke.subtle,
    borderRadius: 12,
    backgroundColor: colors.surface.favOnTint,
  },
  initials: {
    color: colors.text.accentBright,
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.35,
  },
  titleWrap: {
    flex: 1,
    minWidth: 0,
    gap: 6,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  statusText: {
    color: colors.text.accentBright,
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.1,
  },
  title: {
    color: colors.text.primary,
    fontSize: 17,
    lineHeight: 22,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  address: {
    color: colors.text.secondary,
    fontSize: 13,
    lineHeight: 18,
  },
  tags: {
    color: colors.text.secondary,
    fontSize: 11,
    lineHeight: 16,
  },
  noteRow: {
    paddingTop: 2,
  },
  note: {
    color: colors.text.primary,
    fontSize: 14,
    lineHeight: 20,
  },
  noteEmpty: {
    color: colors.text.secondary,
    fontSize: 13,
    lineHeight: 19,
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
    minWidth: 0,
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    gap: 7,
    paddingHorizontal: 9,
  },
  actionLabel: {
    flexShrink: 1,
    color: colors.text.accentBright,
    fontSize: 12,
    fontWeight: '600',
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
