import { Link } from 'expo-router';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';

import { brandColors } from '@/constants/theme';
import type { LeaderboardEntry } from '@/lib/api/leaderboard';
import { flagEmojiFromIso2 } from '@/lib/utils/country-display';
import { formatSplitScore } from '@/lib/pour/format-split-score';
import type { SupportedLocale } from '@/lib/i18n/translations';
import { translate } from '@/lib/i18n/translations';

interface LeaderboardEntryRowProps {
  entry: LeaderboardEntry;
  rank: number;
  locale: SupportedLocale;
}

export function LeaderboardEntryRow({ entry, rank, locale }: LeaderboardEntryRowProps) {
  const pourRef = entry.slug?.trim() || entry.id;
  const uri = entry.split_image_url?.trim() || null;
  const flag = flagEmojiFromIso2(entry.country_code);
  const dateLabel = new Date(entry.created_at).toLocaleDateString(locale);
  const outOf = translate(locale, 'pourOutOfFive');

  return (
    <Link href={`/pour/${pourRef}`} asChild>
      <Pressable style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}>
        <View style={styles.rankBadge}>
          <Text style={styles.rankText}>#{rank}</Text>
        </View>

        {uri ? (
          <Image source={{ uri }} style={styles.thumb} accessibilityIgnoresInvertColors />
        ) : (
          <View style={[styles.thumb, styles.thumbFallback]} />
        )}

        <View style={styles.middle}>
          <View style={styles.middleRow}>
            <View style={styles.nameBlock}>
              <View style={styles.nameRow}>
                {flag ? <Text style={styles.flag}>{flag} </Text> : null}
                <Text style={styles.username} numberOfLines={2}>
                  {entry.username}
                </Text>
                <Text style={styles.username} numberOfLines={2}>
                  {entry.username}
                </Text>
              </View>
              <Text style={styles.date}>{dateLabel}</Text>
            </View>
            <View style={styles.scoreBlock}>
              <Text style={styles.score}>{formatSplitScore(entry.split_score)}</Text>
              <Text style={styles.outOf}>{outOf}</Text>
            </View>
          </View>
        </View>
      </Pressable>
    </Link>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: brandColors.pourCardStroke,
    backgroundColor: 'rgba(29, 24, 15, 0.35)',
    paddingVertical: 14,
    paddingHorizontal: 14,
  },
  cardPressed: {
    borderColor: 'rgba(179, 139, 45, 0.3)',
    backgroundColor: 'rgba(29, 24, 15, 0.5)',
  },
  rankBadge: {
    width: 48,
    height: 48,
    borderRadius: 999,
    backgroundColor: 'rgba(179, 139, 45, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  rankText: {
    fontSize: 15,
    fontWeight: '800',
    color: brandColors.gold,
  },
  thumb: {
    width: 64,
    height: 64,
    borderRadius: 12,
    backgroundColor: 'rgba(11, 11, 11, 0.5)',
  },
  thumbFallback: {
    borderWidth: 1,
    borderColor: brandColors.borderSubtle,
  },
  middle: {
    flex: 1,
    minWidth: 0,
  },
  middleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 10,
  },
  nameBlock: {
    flex: 1,
    minWidth: 0,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    flexWrap: 'wrap',
  },
  flag: {
    fontSize: 17,
    lineHeight: 22,
    fontWeight: '700',
  },
  username: {
    flexShrink: 1,
    fontSize: 17,
    fontWeight: '700',
    color: brandColors.cream,
    lineHeight: 22,
  },
  date: {
    marginTop: 4,
    fontSize: 13,
    fontWeight: '500',
    color: 'rgba(212, 183, 143, 0.7)',
  },
  scoreBlock: {
    alignItems: 'flex-end',
  },
  score: {
    fontSize: 24,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
    color: brandColors.gold,
  },
  outOf: {
    marginTop: 2,
    fontSize: 12,
    fontWeight: '600',
    color: 'rgba(212, 183, 143, 0.6)',
  },
});
