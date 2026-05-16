import { useQuery } from '@tanstack/react-query';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { FlatList, type ListRenderItem, RefreshControl, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppButton } from '@/components/split-the-g/button';
import { PourGridCard } from '@/components/split-the-g/pour-grid-card';
import { DiscoverSegmentHeader, DiscoverSectionTitle } from '@/components/split-the-g/discover-feed-chrome';
import { WallFeedBody } from '@/components/split-the-g/wall-feed-body';
import { Card } from '@/components/split-the-g/screen';
import { ScreenLoadingBlock } from '@/components/split-the-g/screen-loading';
import { Body, Muted } from '@/components/split-the-g/typography';
import { UnderlineTabRow } from '@/components/split-the-g/underline-tab-row';
import { SCREEN_EDGE_GUTTER } from '@/constants/layout';
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
  const router = useRouter();
  const { t, tVars } = useLocale();
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
    staleTime: 180_000,
  });

  const pourCount = scores.data?.length ?? 0;

  const renderItem: ListRenderItem<PourScore> = ({ item }) => (
    <View style={styles.gridCell}>
      <PourGridCard score={item} />
    </View>
  );

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.discoverTabChrome} accessibilityRole="tablist">
        <UnderlineTabRow<'feed' | 'wall'>
          tabs={[
            { key: 'feed', label: t('navFeed') },
            { key: 'wall', label: t('navWall') },
          ]}
          active={segment}
          onChange={(next) => setSegment(next)}
        />
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
            <DiscoverSegmentHeader
              eyebrow={t('feedEyebrow')}
              title={t('feedTitle')}
              subtitle={t('feedSubtitle')}
              titleTrailing={
                <AppButton
                  label={t('homeScorePour')}
                  variant="secondary"
                  shape="pill"
                  accessibilityLabel={t('homeScorePour')}
                  onPress={() => router.push('/')}
                  style={styles.scorePourBtn}
                />
              }>
              {!scores.isLoading && !scores.error && pourCount > 0 ? (
                <DiscoverSectionTitle style={styles.gridSectionTitle}>
                  {pourCount === 1
                    ? t('feedGridIntroOne')
                    : tVars('feedGridIntroMany', { count: pourCount })}
                </DiscoverSectionTitle>
              ) : null}
            </DiscoverSegmentHeader>
          }
          ListEmptyComponent={
            scores.isLoading ? (
              <ScreenLoadingBlock dense />
            ) : scores.error ? (
              <Card>
                <Body>{t('feedLoadError')}</Body>
                <Muted>{scores.error.message}</Muted>
              </Card>
            ) : (
              <Card>
                <Body>{t('feedEmptyState')}</Body>
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
  discoverTabChrome: {
    paddingHorizontal: SCREEN_EDGE_GUTTER,
    paddingTop: 8,
    marginBottom: 4,
  },
  list: { flex: 1 },
  content: {
    paddingHorizontal: SCREEN_EDGE_GUTTER,
    paddingTop: 4,
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
  /** Space above the grid intros — aligns with inset between header actions and sections on Wall. */
  gridSectionTitle: {
    marginTop: 12,
  },
  /** Matches `heroCreateBtn` on Competitions — compact outline pill on the title row. */
  scorePourBtn: {
    flexShrink: 0,
    alignSelf: 'center',
    minHeight: 36,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
});
