import { useQuery } from '@tanstack/react-query';
import { RefreshControl, StyleSheet, View } from 'react-native';

import { ScoreCard } from '@/components/split-the-g/score-card';
import { Card, Screen } from '@/components/split-the-g/screen';
import { Body, Eyebrow, Muted, Title } from '@/components/split-the-g/typography';
import { fetchRecentScores } from '@/lib/api/client';

export default function FeedScreen() {
  const scores = useQuery({
    queryKey: ['scores', 'recent'],
    queryFn: () => fetchRecentScores(25),
  });

  return (
    <Screen
      refreshControl={
        <RefreshControl refreshing={scores.isRefetching} onRefresh={() => scores.refetch()} />
      }>
      <View style={styles.header}>
        <Eyebrow>Social</Eyebrow>
        <Title>Latest pours</Title>
        <Muted>Native feed backed by Supabase reads under the same RLS model as web.</Muted>
      </View>

      {scores.isLoading ? (
        <Card>
          <Body>Loading pours...</Body>
        </Card>
      ) : null}

      {scores.error ? (
        <Card>
          <Body>Feed unavailable</Body>
          <Muted>{scores.error.message}</Muted>
        </Card>
      ) : null}

      {scores.data?.map((score) => <ScoreCard key={score.id} score={score} />)}
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    gap: 10,
    paddingTop: 16,
  },
});
