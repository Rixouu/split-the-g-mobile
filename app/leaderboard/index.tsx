import { useQuery } from '@tanstack/react-query';
import { StyleSheet, View } from 'react-native';

import { ScoreCard } from '@/components/split-the-g/score-card';
import { Card, Screen } from '@/components/split-the-g/screen';
import { Body, Eyebrow, Muted, Title } from '@/components/split-the-g/typography';
import { fetchLeaderboard } from '@/lib/api/client';

export default function LeaderboardScreen() {
  const leaderboard = useQuery({
    queryKey: ['leaderboard', 'global'],
    queryFn: () => fetchLeaderboard(25),
  });

  return (
    <Screen>
      <View style={styles.header}>
        <Eyebrow>Leaderboard</Eyebrow>
        <Title>Top pours</Title>
        <Muted>Global high scores using direct Supabase reads.</Muted>
      </View>

      {leaderboard.isLoading ? (
        <Card>
          <Body>Loading leaderboard...</Body>
        </Card>
      ) : null}

      {leaderboard.error ? (
        <Card>
          <Body>Leaderboard unavailable</Body>
          <Muted>{leaderboard.error.message}</Muted>
        </Card>
      ) : null}

      {leaderboard.data?.map((score) => <ScoreCard key={score.id} score={score} />)}
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    gap: 10,
    paddingTop: 16,
  },
});
