import { useQuery } from '@tanstack/react-query';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { FlatList, Linking, type ListRenderItem, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppButton } from '@/components/split-the-g/button';
import { PourGridCard } from '@/components/split-the-g/pour-grid-card';
import { DiscoverSegmentHeader, DiscoverSectionTitle } from '@/components/split-the-g/discover-feed-chrome';
import { PromotionSpotCard } from '@/components/split-the-g/promotion-spot-card';
import { WallFeedBody } from '@/components/split-the-g/wall-feed-body';
import { Card } from '@/components/split-the-g/screen';
import { ScreenLoadingBlock } from '@/components/split-the-g/screen-loading';
import { Body, Muted } from '@/components/split-the-g/typography';
import { UnderlineTabRow } from '@/components/split-the-g/underline-tab-row';
import { SCREEN_EDGE_GUTTER } from '@/constants/layout';
import { brandColors } from '@/constants/theme';
import { fetchRecentScores } from '@/lib/api/client';
import type { PourScore } from '@/lib/api/types';
import { fetchThailandGuinnessFeedNews } from '@/lib/feed/news';
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

  const news = useQuery({
    queryKey: ['feed', 'thailand-guinness-news'],
    queryFn: () => fetchThailandGuinnessFeedNews(6),
    enabled: segment === 'feed',
    staleTime: 300_000,
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
              <PromotionSpotCard
                eyebrow={t('feedSponsorEyebrow')}
                description={t('feedSponsorBody')}
                actionLabel={t('feedSponsorCta')}
                onActionPress={() => void Linking.openURL('mailto:contact@split-the-g.app?subject=Split%20the%20G%20%E2%80%94%20feed%20advertising')}
                style={styles.promotion}
              />
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
          ListFooterComponent={
            !news.isLoading && (news.data?.length ?? 0) > 0 ? (
              <View style={styles.newsSection}>
                <DiscoverSectionTitle>{t('feedNewsTitle')}</DiscoverSectionTitle>
                <View style={styles.newsList}>
                  {news.data!.map((item) => (
                    <Pressable
                      key={item.link}
                      style={({ pressed }) => [styles.newsCard, pressed && styles.newsCardPressed]}
                      accessibilityRole="link"
                      accessibilityLabel={`${item.title}. ${t('feedNewsReadMore')}`}
                      onPress={() => void Linking.openURL(item.link)}>
                      <Text style={styles.newsSource}>{item.source}</Text>
                      <Text style={styles.newsTitle} numberOfLines={2}>
                        {item.title}
                      </Text>
                      {item.summary ? (
                        <Text style={styles.newsSummary} numberOfLines={2}>
                          {item.summary}
                        </Text>
                      ) : null}
                      <Text style={styles.newsAction}>{t('feedNewsReadMore')} →</Text>
                    </Pressable>
                  ))}
                </View>
              </View>
            ) : null
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
  promotion: {
    marginTop: 4,
  },
  newsSection: {
    marginTop: 18,
  },
  newsList: {
    gap: 10,
  },
  newsCard: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: brandColors.frame,
    backgroundColor: 'rgba(29, 24, 15, 0.42)',
    padding: 14,
    gap: 6,
  },
  newsCardPressed: {
    opacity: 0.84,
  },
  newsSource: {
    color: 'rgba(197, 160, 89, 0.78)',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  newsTitle: {
    color: brandColors.cream,
    fontSize: 15,
    fontWeight: '700',
    lineHeight: 21,
  },
  newsSummary: {
    color: 'rgba(212, 183, 143, 0.7)',
    fontSize: 13,
    lineHeight: 18,
  },
  newsAction: {
    color: brandColors.goldBright,
    fontSize: 12,
    fontWeight: '800',
    marginTop: 2,
  },
});
