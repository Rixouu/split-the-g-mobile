import { useQuery } from '@tanstack/react-query';
import { FlatList, ListRenderItem, RefreshControl, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ScoreCard } from '@/components/split-the-g/score-card';
import { Card } from '@/components/split-the-g/screen';
import { Body, Eyebrow, Muted, Title } from '@/components/split-the-g/typography';
import { brandColors } from '@/constants/theme';
import { fetchRecentScores } from '@/lib/api/client';
import type { PourScore } from '@/lib/api/types';
import { useLocale } from '@/lib/i18n/locale-context';

export default function WallScreen() {
  const { t } = useLocale();
  const scores = useQuery({
    queryKey: ['scores', 'wall'],
    queryFn: () => fetchRecentScores(50),
  });

  const renderItem: ListRenderItem<PourScore> = ({ item }) => <ScoreCard score={item} />;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <FlatList
        style={styles.list}
        contentContainerStyle={styles.content}
        data={scores.data ?? []}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        ListHeaderComponent={
          <View style={styles.header}>
            <Eyebrow>{t('wallEyebrow')}</Eyebrow>
            <Title>{t('wallTitle')}</Title>
            <Muted>{t('wallSubtitle')}</Muted>
          </View>
        }
        ListEmptyComponent={
          scores.isLoading ? (
            <Card>
              <Body>Loading wall…</Body>
            </Card>
          ) : scores.error ? (
            <Card>
              <Body>Wall unavailable</Body>
              <Muted>{scores.error.message}</Muted>
            </Card>
          ) : (
            <Card>
              <Body>No pours yet.</Body>
            </Card>
          )
        }
        refreshControl={
          <RefreshControl
            refreshing={scores.isRefetching}
            onRefresh={() => scores.refetch()}
            tintColor={brandColors.gold}
          />
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: brandColors.black,
  },
  list: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 132,
    gap: 14,
  },
  header: {
    gap: 10,
    marginBottom: 8,
    paddingTop: 8,
  },
});
