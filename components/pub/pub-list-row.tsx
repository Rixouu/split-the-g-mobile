import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { brandColors } from '@/constants/theme';
import type { PubSummary } from '@/lib/api/types';
import { useLocale } from '@/lib/i18n/locale-context';

interface PubListRowProps {
  pub: PubSummary;
  onPress: () => void;
}

function initialsFromName(displayName: string): string {
  const words = displayName.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return '?';
  if (words.length === 1) {
    const w = words[0];
    return w.length >= 2 ? w.slice(0, 2).toUpperCase() : `${w.toUpperCase()}?`;
  }
  const a = words[0][0];
  const b = words[1][0];
  if (!a || !b) return '?';
  return `${a}${b}`.toUpperCase();
}

export function PubListRow({ pub, onPress }: PubListRowProps) {
  const { t, tVars } = useLocale();
  const title = (pub.display_name || '').trim() || t('pubsCardUnnamed');
  const addressLine = pub.sample_address?.trim() || t('pubsCardAddressPending');

  const pourLabel =
    pub.submission_count === 1 ? t('pubsCardPourOne') : tVars('pubsCardPourMany', { count: pub.submission_count });
  const ratingLabel =
    pub.rating_count === 1 ? t('pubsListingRatingsOne') : tVars('pubsListingRatingsMany', { count: pub.rating_count });

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${title}. ${addressLine}`}
      onPress={() => {
        void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onPress();
      }}
      style={({ pressed }) => [styles.pressable, pressed && styles.pressablePressed]}>
      <View style={styles.row}>
        <View style={styles.avatar} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
          <Text style={styles.avatarLetters}>{initialsFromName(title)}</Text>
        </View>

        <View style={styles.body}>
          <Text style={styles.title} numberOfLines={2}>
            {title}
          </Text>
          <Text style={styles.address} numberOfLines={2} ellipsizeMode="tail">
            {addressLine}
          </Text>

          <View style={styles.statsRow}>
            {pub.avg_pour_rating != null && Number.isFinite(pub.avg_pour_rating) ? (
              <View style={styles.statItem}>
                <MaterialCommunityIcons name="star" size={14} color={brandColors.goldBright} />
                <Text style={styles.statHighlight}>{pub.avg_pour_rating.toFixed(1)}</Text>
              </View>
            ) : (
              <View style={styles.statItem}>
                <MaterialCommunityIcons name="star-outline" size={14} color={brandColors.tanMuted} />
                <Text style={styles.statMuted}>—</Text>
              </View>
            )}
            <Text style={styles.statDot}>·</Text>
            <View style={styles.statItem}>
              <MaterialCommunityIcons name="beer-outline" size={14} color={brandColors.tanMuted} />
              <Text style={styles.statMuted}>{pourLabel}</Text>
            </View>
            <Text style={styles.statDot}>·</Text>
            <View style={styles.statItem}>
              <MaterialCommunityIcons name="playlist-star" size={14} color={brandColors.tanMuted} />
              <Text style={styles.statMuted}>{ratingLabel}</Text>
            </View>
          </View>
        </View>

        <MaterialCommunityIcons
          name="chevron-right"
          size={22}
          color="rgba(212, 183, 143, 0.35)"
          style={styles.chevron}
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
        />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pressable: {
    borderRadius: 14,
  },
  pressablePressed: {
    opacity: 0.92,
    transform: [{ scale: 0.992 }],
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: brandColors.pourCardStroke,
    borderRadius: 14,
    backgroundColor: 'rgba(29, 24, 15, 0.72)',
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 12,
    backgroundColor: 'rgba(179, 139, 45, 0.16)',
    borderWidth: 1,
    borderColor: brandColors.borderSubtle,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarLetters: {
    color: brandColors.goldBright,
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  body: {
    flex: 1,
    minWidth: 0,
    gap: 6,
  },
  title: {
    color: brandColors.cream,
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: -0.25,
    lineHeight: 22,
  },
  address: {
    color: 'rgba(253, 251, 243, 0.62)',
    fontSize: 13,
    lineHeight: 18,
    letterSpacing: 0.15,
  },
  statsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 6,
    marginTop: 2,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  statHighlight: {
    color: brandColors.goldBright,
    fontSize: 13,
    fontWeight: '700',
  },
  statMuted: {
    color: brandColors.tanMuted,
    fontSize: 13,
    fontWeight: '500',
  },
  statDot: {
    color: 'rgba(212, 183, 143, 0.28)',
    fontSize: 13,
    fontWeight: '600',
  },
  chevron: {
    marginRight: -2,
  },
});
