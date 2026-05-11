import { Image, StyleSheet, View } from 'react-native';
import { Link } from 'expo-router';

import { brandColors } from '@/constants/theme';
import { absoluteWebUrl } from '@/lib/api/client';
import type { PourScore } from '@/lib/api/types';

import { Body, Muted } from './typography';

interface ScoreCardProps {
  score: PourScore;
}

function formatScore(value: number | null): string {
  if (typeof value !== 'number') return '--';
  return `${Math.round(value)}%`;
}

export function ScoreCard({ score }: ScoreCardProps) {
  const pourRef = score.slug || score.id;

  return (
    <Link href={`/pour/${pourRef}`} asChild>
      <View style={styles.card}>
        {score.pint_image_url ? (
          <Image source={{ uri: score.pint_image_url }} style={styles.image} />
        ) : (
          <View style={[styles.image, styles.imageFallback]} />
        )}
        <View style={styles.content}>
          <Body style={styles.score}>{formatScore(score.split_score)}</Body>
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
