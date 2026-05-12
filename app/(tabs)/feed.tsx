import { useQuery } from '@tanstack/react-query';
import { Link, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
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
import { WallFeedBody } from '@/components/split-the-g/wall-feed-body';
import { Card } from '@/components/split-the-g/screen';
import { Body, Muted } from '@/components/split-the-g/typography';
import { brandColors } from '@/constants/theme';
import { fetchRecentScores } from '@/lib/api/client';
import type { PourScore } from '@/lib/api/types';
import { useLocale } from '@/lib/i18n/locale-context';

type DiscoverSegment = 'feed' | 'wall';

function normalizeTabParam(raw: string | string[] | undefined): DiscoverSegment | null {
  const v = typeof raw === 'string' ? raw : raw?.[0];
  if (v === 'wall' || v === 'feed') return v;
  return null;
}

export default function FeedScreen() {
  const { t } = useLocale();
  const { tab: tabParam } = useLocalSearchParams<{ tab?: string | string[] }>();
  const tabFromUrl = normalizeTabParam(tabParam);
  const [segment, setSegment] = useState<DiscoverSegment>(tabFromUrl === 'wall' ? 'wall' : 'feed');

  useEffect(() => {
    if (tabFromUrl) setSegment(tabFromUrl);
  }, [tabFromUrl]);

  const scores = useQuery({
    queryKey: ['scores', 'recent'],
    queryFn: () => fetchRecentScores(36),
    enabled: segment === 'feed',
  });

  const renderItem: ListRenderItem<PourScore> = ({ item }) => (
    <View style={styles.gridCell}>
      <PourGridCard score={item} />
    </View>
  );

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.segment} accessibilityRole="tablist">
        {(['feed', 'wall'] as const).map((k) => {
          const active = segment === k;
          const label = k === 'feed' ? t('navFeed') : t('navWall');
          return (
            <Pressable
              key={k}
              onPress={() => setSegment(k)}
              style={[styles.segmentTab, active && styles.segmentTabActive]}
              accessibilityRole="tab"
              accessibilityState={{ selected: active }}>
              <Text style={[styles.segmentLabel, active && styles.segmentLabelActive]}>{label}</Text>
            </Pressable>
          );
        })}
      </View>

      {segment === 'wall' ? (
        <WallFeedBody />
      ) : (
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
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: brandColors.black,
  },
  segment: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginTop: 4,
    marginBottom: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: brandColors.border,
    overflow: 'hidden',
    backgroundColor: 'rgba(29, 24, 15, 0.45)',
  },
  segmentTab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  segmentTabActive: {
    backgroundColor: 'rgba(212, 183, 143, 0.18)',
  },
  segmentLabel: {
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
    color: 'rgba(212, 183, 143, 0.45)',
  },
  segmentLabelActive: {
    color: brandColors.goldBright,
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
