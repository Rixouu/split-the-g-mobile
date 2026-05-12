import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { brandColors } from '@/constants/theme';
import type { PourScore } from '@/lib/api/types';
import { useLocale } from '@/lib/i18n/locale-context';
import { formatSplitScore } from '@/lib/pour/format-split-score';

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
}

export function PourListRow({ score }: PourListRowProps) {
  const { t } = useLocale();
  const router = useRouter();
  const pourRef = score.slug || score.id;
  const uri = score.pint_image_url?.trim() || null;
  const username = score.username?.trim() || t('pourAnonymousDisplay');
  const barName = score.bar_name?.trim() || null;

  return (
    <Pressable
      style={({ pressed }) => [styles.row, pressed && styles.pressed]}
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
            {username}
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
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: brandColors.pourCardStroke,
    backgroundColor: 'rgba(11, 11, 11, 0.35)',
    paddingVertical: 8,
    paddingHorizontal: 10,
  },
  pressed: {
    opacity: 0.9,
    backgroundColor: 'rgba(29, 24, 15, 0.45)',
  },
  thumbWrap: {
    borderRadius: 10,
    overflow: 'hidden',
    width: 56,
    height: 56,
    backgroundColor: brandColors.panelMuted,
  },
  thumb: {
    width: '100%',
    height: '100%',
  },
  thumbFallback: {
    borderWidth: 1,
    borderColor: brandColors.border,
  },
  body: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  topLine: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    gap: 8,
  },
  name: {
    flex: 1,
    fontSize: 13,
    fontWeight: '700',
    color: brandColors.cream,
  },
  score: {
    fontSize: 13,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
    color: brandColors.goldBright,
  },
  when: {
    fontSize: 11,
    color: 'rgba(212, 183, 143, 0.55)',
  },
  barLine: {
    marginTop: 2,
    fontSize: 11,
    fontWeight: '600',
    color: 'rgba(197, 160, 89, 0.72)',
  },
});
