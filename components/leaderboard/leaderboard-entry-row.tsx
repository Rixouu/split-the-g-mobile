import { Link } from 'expo-router';
import { Image } from 'expo-image';
import { Pressable, StyleSheet, Text, View } from 'react-native';

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

const THUMB_SIZE = 64;

export function LeaderboardEntryRow({ entry, rank, locale }: LeaderboardEntryRowProps) {
  const pourRef = entry.slug?.trim() || entry.id;
  const uri = entry.split_image_url?.trim() || null;
  const flag = flagEmojiFromIso2(entry.country_code);
  const dateLabel = new Date(entry.created_at).toLocaleDateString(locale);
  const outOf = translate(locale, 'pourOutOfFive');
  const displayUsername = entry.username?.trim().length ? entry.username.trim() : translate(locale, 'pourAnonymousDisplay');

  return (
    <Link href={`/pour/${pourRef}`} asChild>
      <Pressable style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}>
        <View style={styles.rankColumn}>
          <Text style={styles.rankText}>#{rank}</Text>
        </View>

        <View style={styles.thumbSlot}>
          {uri ? (
            <Image
              source={{ uri }}
              style={styles.thumbImg}
              contentFit="cover"
              cachePolicy="memory-disk"
              recyclingKey={`${pourRef}-${rank}`}
              accessibilityIgnoresInvertColors
            />
          ) : (
            <View style={[styles.thumbImg, styles.thumbFallback]} accessibilityRole="image" />
          )}
        </View>

        <View style={styles.middle}>
          <View style={styles.middleRow}>
            <View style={styles.nameBlock}>
              <View style={styles.nameRow}>
                {flag ? <Text style={styles.flag}>{flag}</Text> : null}
                <Text style={[styles.username, flag ? styles.usernameBesideFlag : null]} numberOfLines={2}>
                  {displayUsername}
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
    backgroundColor: '#121212',
    paddingVertical: 14,
    paddingHorizontal: 14,
  },
  cardPressed: {
    borderColor: 'rgba(179, 139, 45, 0.35)',
    backgroundColor: '#181818',
  },
  rankColumn: {
    minWidth: 36,
    flexShrink: 0,
    justifyContent: 'center',
  },
  rankText: {
    fontSize: 17,
    fontWeight: '800',
    color: brandColors.gold,
    fontVariant: ['tabular-nums'],
  },
  thumbSlot: {
    flexShrink: 0,
    width: THUMB_SIZE,
    height: THUMB_SIZE,
    borderRadius: 12,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(11, 11, 11, 0.5)',
  },
  thumbImg: {
    width: THUMB_SIZE,
    height: THUMB_SIZE,
    flexShrink: 0,
    borderRadius: 12,
  },
  thumbFallback: {
    borderWidth: 1,
    borderColor: brandColors.borderSubtle,
  },
  middle: {
    flex: 1,
    minWidth: 0,
    minHeight: THUMB_SIZE,
    justifyContent: 'center',
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
  },
  flag: {
    fontSize: 17,
    lineHeight: 22,
    fontWeight: '700',
    flexShrink: 0,
  },
  username: {
    flex: 1,
    flexShrink: 1,
    fontSize: 17,
    fontWeight: '700',
    color: brandColors.cream,
    lineHeight: 22,
  },
  usernameBesideFlag: {
    marginLeft: 6,
  },
  date: {
    marginTop: 4,
    fontSize: 13,
    fontWeight: '500',
    color: 'rgba(212, 183, 143, 0.7)',
  },
  scoreBlock: {
    flexShrink: 0,
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
