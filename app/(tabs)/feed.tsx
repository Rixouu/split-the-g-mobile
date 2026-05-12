import { useQuery } from '@tanstack/react-query';
import { Link } from 'expo-router';
import {
  FlatList,
  type ListRenderItem,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { PourGridCard } from '@/components/split-the-g/pour-grid-card';
import { Card } from '@/components/split-the-g/screen';
import { Body, Muted } from '@/components/split-the-g/typography';
import { brandColors } from '@/constants/theme';
import { fetchRecentScores } from '@/lib/api/client';
import type { PourScore } from '@/lib/api/types';
import { useLocale } from '@/lib/i18n/locale-context';

export default function FeedScreen() {
  const { t } = useLocale();
  const scores = useQuery({
    queryKey: ['scores', 'recent'],
    queryFn: () => fetchRecentScores(36),
  });

  const renderItem: ListRenderItem<PourScore> = ({ item }) => (
    <View style={styles.gridCell}>
      <PourGridCard score={item} />
    </View>
  );

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <FlatList
        style={styles.list}
        contentContainerStyle={styles.content}
        data={scores.data ?? []}
        keyExtractor={(item) => item.id}
        numColumns={2}
        columnWrapperStyle={styles.columnWrap}
        renderItem={renderItem}
        ListHeaderComponent={
          <View style={styles.header}>
            <Text style={styles.heroTitle}>{t('navFeed')}</Text>
            <Muted style={styles.heroSubtitle}>{t('feedSubtitle')}</Muted>
            <Link href="/" asChild>
              <Pressable style={({ pressed }) => [styles.cta, pressed && styles.ctaPressed]} accessibilityRole="button">
                <Text style={styles.ctaLabel}>{t('homeScorePour')}</Text>
              </Pressable>
            </Link>
            <Text style={styles.sectionLabel}>{t('feedPoursSection')}</Text>
          </View>
        }
        ListEmptyComponent={
          scores.isLoading ? (
            <Card>
              <Body>Loading pours...</Body>
            </Card>
          ) : scores.error ? (
            <Card>
              <Body>Feed unavailable</Body>
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
  list: { flex: 1 },
  content: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 132,
    gap: 0,
  },
  columnWrap: {
    gap: 12,
    marginBottom: 12,
  },
  gridCell: {
    flex: 1,
    minWidth: 0,
  },
  header: {
    marginBottom: 20,
    gap: 12,
    paddingTop: 4,
  },
  heroTitle: {
    fontSize: 34,
    fontWeight: '800',
    letterSpacing: -0.6,
    color: brandColors.goldBright,
  },
  heroSubtitle: {
    marginTop: -4,
  },
  cta: {
    marginTop: 4,
    borderRadius: 999,
    backgroundColor: brandColors.gold,
    paddingVertical: 14,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaPressed: {
    opacity: 0.92,
    transform: [{ scale: 0.99 }],
  },
  ctaLabel: {
    fontSize: 15,
    fontWeight: '800',
    color: brandColors.black,
    letterSpacing: 0.2,
  },
  sectionLabel: {
    marginTop: 8,
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: -0.2,
    color: brandColors.cream,
  },
});
