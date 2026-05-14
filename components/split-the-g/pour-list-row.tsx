import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { brandColors } from '@/constants/theme';
import type { PourScore } from '@/lib/api/types';
import { useLocale } from '@/lib/i18n/locale-context';
import { formatSplitScore } from '@/lib/pour/format-split-score';
import { flagEmojiFromIso2 } from '@/lib/utils/country-display';

function formatPourWhen(iso: string | null | undefined): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (!Number.isFinite(d.getTime())) return '';
  return d.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

interface PourListRowProps {
  score: PourScore;
  /** When false, omits the bottom hairline — use on the last row in a stacked list. */
  showSeparatorBelow?: boolean;
}

export function PourListRow({ score, showSeparatorBelow = true }: PourListRowProps) {
  const { t } = useLocale();
  const router = useRouter();
  const pourRef = score.slug || score.id;
  const uri = score.pint_image_url?.trim() || null;
  const username = score.username?.trim() || t('pourAnonymousDisplay');
  const flag = flagEmojiFromIso2(score.country_code);
  const displayName = flag ? `${flag} ${username}` : username;
  const barName = score.bar_name?.trim() || null;

  return (
    <Pressable
      android_ripple={{ color: 'rgba(197, 160, 89, 0.12)' }}
      style={({ pressed }) => [
        styles.row,
        showSeparatorBelow && styles.rowWithSep,
        pressed && styles.pressed,
      ]}
      accessibilityRole="button"
      onPress={() => router.push(`/pour/${pourRef}`)}>
      <View style={styles.thumbWrap}>
        {uri ? (
          <Image source={{ uri }} style={styles.thumb} contentFit="cover" transition={150} />
        ) : (
          <View style={[styles.thumb, styles.thumbFallback]} />
        )}
      </View>
      <View style={styles.body}>
        <View style={styles.topLine}>
          <Text style={styles.name} numberOfLines={1}>
            {displayName}
          </Text>
          <Text style={styles.score}>{formatSplitScore(score.split_score)}</Text>
        </View>
        <Text style={styles.when}>{formatPourWhen(score.created_at)}</Text>
        {barName ? (
          <Text style={styles.barLine} numberOfLines={1}>
            {barName}
          </Text>
        ) : null}
      </View>
      <Ionicons name="chevron-forward" size={20} color="rgba(197, 160, 89, 0.35)" style={styles.chevron} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 14,
    paddingRight: 2,
    minHeight: 72,
    backgroundColor: 'transparent',
  },
  rowWithSep: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: brandColors.borderSubtle,
  },
  pressed: {
    opacity: 0.85,
    backgroundColor: 'rgba(29, 24, 15, 0.4)',
  },
  thumbWrap: {
    borderRadius: 14,
    overflow: 'hidden',
    width: 68,
    height: 68,
    backgroundColor: brandColors.panelMuted,
  },
  thumb: {
    width: '100%',
    height: '100%',
  },
  thumbFallback: {
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: brandColors.border,
  },
  body: {
    flex: 1,
    minWidth: 0,
    gap: 3,
    paddingVertical: 1,
  },
  topLine: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  name: {
    flex: 1,
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.15,
    color: brandColors.cream,
  },
  score: {
    fontSize: 15,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
    color: brandColors.goldBright,
  },
  when: {
    fontSize: 12,
    color: 'rgba(212, 183, 143, 0.58)',
  },
  barLine: {
    marginTop: 1,
    fontSize: 12,
    fontWeight: '600',
    color: brandColors.goldBright,
    opacity: 0.88,
  },
  chevron: {
    marginLeft: 4,
  },
});
