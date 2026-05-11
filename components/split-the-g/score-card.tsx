import { Link } from 'expo-router';
import { Image, StyleSheet, View } from 'react-native';

import { brandColors } from '@/constants/theme';
import { absoluteWebUrl } from '@/lib/api/client';
import type { PourScore } from '@/lib/api/types';
import { formatSplitScore } from '@/lib/pour/format-split-score';

import { Body, Muted } from './typography';

interface ScoreCardProps {
  score: PourScore;
  /** When set (e.g. leaderboard), shown instead of `pint_image_url`. */
  previewImageUrl?: string | null;
}

export function ScoreCard({ score, previewImageUrl }: ScoreCardProps) {
  const pourRef = score.slug || score.id;
  const uri = previewImageUrl?.trim() || score.pint_image_url?.trim() || null;

  return (
    <Link href={`/pour/${pourRef}`} asChild>
      <View style={styles.card}>
        {uri ? (
          <Image source={{ uri }} style={styles.image} />
        ) : (
          <View style={[styles.image, styles.imageFallback]} />
        )}
        <View style={styles.content}>
          <Body style={styles.score}>{formatSplitScore(score.split_score)}</Body>
          <Muted numberOfLines={1}>{score.username || 'Split The G drinker'}</Muted>
          <Muted numberOfLines={1}>
            {[score.city, score.country].filter(Boolean).join(', ') || absoluteWebUrl(`/pour/${pourRef}`)}
          </Muted>
        </View>
      </View>
    </Link>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    gap: 14,
    borderWidth: 1,
    borderColor: brandColors.frame,
    borderRadius: 14,
    backgroundColor: 'rgba(29, 24, 15, 0.45)',
    padding: 12,
  },
  image: {
    width: 76,
    height: 96,
    borderRadius: 16,
    backgroundColor: brandColors.panelMuted,
  },
  imageFallback: {
    borderWidth: 1,
    borderColor: brandColors.border,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    gap: 4,
  },
  score: {
    color: brandColors.goldBright,
    fontSize: 28,
    fontWeight: '900',
  },
});
