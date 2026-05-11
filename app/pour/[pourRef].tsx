import { useLocalSearchParams } from 'expo-router';
import { Image, Share, StyleSheet, View } from 'react-native';
import { useQuery } from '@tanstack/react-query';

import { AppButton } from '@/components/split-the-g/button';
import { Card, Screen } from '@/components/split-the-g/screen';
import { Body, Eyebrow, Muted, Title } from '@/components/split-the-g/typography';
import { brandColors } from '@/constants/theme';
import { absoluteWebUrl, fetchScoreByRef } from '@/lib/api/client';

function formatScore(value: number | null): string {
  if (typeof value !== 'number') return '--';
  return `${Math.round(value)}%`;
}

export default function PourDetailScreen() {
  const { pourRef } = useLocalSearchParams<{ pourRef: string }>();
  const score = useQuery({
    queryKey: ['score', pourRef],
    queryFn: () => fetchScoreByRef(pourRef),
    enabled: Boolean(pourRef),
  });
  const sharePath = score.data ? `/pour/${score.data.slug || score.data.id}` : `/pour/${pourRef}`;

  async function shareResult() {
    const url = absoluteWebUrl(sharePath);
    await Share.share({
      message: `Split The G result: ${url}`,
      url,
    });
  }

  return (
    <Screen>
      <View style={styles.header}>
        <Eyebrow>Pour result</Eyebrow>
        <Title>{formatScore(score.data?.split_score ?? null)}</Title>
        <Muted>{score.data?.username || 'Split The G drinker'}</Muted>
      </View>

      {score.isLoading ? (
        <Card>
          <Body>Loading pour...</Body>
        </Card>
      ) : null}

      {score.error ? (
        <Card>
          <Body>Could not load this pour</Body>
          <Muted>{score.error.message}</Muted>
        </Card>
      ) : null}

      {score.data ? (
        <Card>
          {score.data.pint_image_url ? (
            <Image source={{ uri: score.data.pint_image_url }} style={styles.image} />
          ) : null}
          <Body>{[score.data.city, score.data.country].filter(Boolean).join(', ')}</Body>
          <Muted>{absoluteWebUrl(sharePath)}</Muted>
          <AppButton label="Share result" onPress={shareResult} />
        </Card>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    gap: 10,
    paddingTop: 16,
  },
  image: {
    width: '100%',
    height: 420,
    borderRadius: 24,
    backgroundColor: brandColors.panelMuted,
  },
});
