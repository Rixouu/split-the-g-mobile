import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import {
  RefreshControl,
  ScrollView,
  StyleSheet,
  useWindowDimensions,
  View,
} from 'react-native';

import {
  DiscoverSegmentHeader,
  DiscoverSectionTitle,
  discoverChromeStyles,
} from '@/components/split-the-g/discover-feed-chrome';
import { PourGridCard } from '@/components/split-the-g/pour-grid-card';
import { PourListRow } from '@/components/split-the-g/pour-list-row';
import { Card } from '@/components/split-the-g/screen';
import { ScreenLoadingBlock } from '@/components/split-the-g/screen-loading';
import { Body, Muted } from '@/components/split-the-g/typography';
import { SCREEN_EDGE_GUTTER } from '@/constants/layout';
import { brandColors } from '@/constants/theme';
import { fetchRecentScores } from '@/lib/api/client';
import type { PourScore } from '@/lib/api/types';
import { useLocale } from '@/lib/i18n/locale-context';

const MS_DAY = 86_400_000;
const MS_WEEK = 7 * MS_DAY;

function pourTime(score: PourScore): number {
  const raw = score.created_at;
  if (!raw) return 0;
  const t = new Date(raw).getTime();
  return Number.isFinite(t) ? t : 0;
}

function scoreValue(score: PourScore): number {
  const v = score.split_score;
  return typeof v === 'number' && Number.isFinite(v) ? v : 0;
}

function chunkPairs<T>(items: T[]): T[][] {
  const rows: T[][] = [];
  for (let i = 0; i < items.length; i += 2) {
    rows.push(items.slice(i, i + 2));
  }
  return rows;
}

function WallInsetList({ children }: { children: React.ReactNode }) {
  return <View style={styles.insetList}>{children}</View>;
}

const CAROUSEL_GAP = 12;

export function WallFeedBody() {
  const { t } = useLocale();
  const { width: windowWidth } = useWindowDimensions();
  const scores = useQuery({
    queryKey: ['scores', 'wall'],
    queryFn: () => fetchRecentScores(80),
    staleTime: 180_000,
  });

  const { last24, weekTop, archive } = useMemo(() => {
    const data = scores.data ?? [];
    const now = Date.now();
    const sorted = [...data].sort((a, b) => pourTime(b) - pourTime(a));
    const last24h = sorted.filter((s) => now - pourTime(s) <= MS_DAY);
    const ids24 = new Set(last24h.map((s) => s.id));
    const inWeekNot24 = sorted.filter((s) => now - pourTime(s) <= MS_WEEK && !ids24.has(s.id));
    const topWeek = [...inWeekNot24].sort((a, b) => scoreValue(b) - scoreValue(a)).slice(0, 12);
    const older = sorted.filter((s) => !ids24.has(s.id));
    return { last24: last24h, weekTop: topWeek, archive: older };
  }, [scores.data]);

  const archiveRows = useMemo(() => chunkPairs(archive), [archive]);

  const carouselTileWidth = Math.min(168, Math.round(windowWidth * 0.44));
  const carouselSnapOffsets = useMemo(
    () => last24.map((_, i) => i * (carouselTileWidth + CAROUSEL_GAP)),
    [carouselTileWidth, last24.length],
  );

  const empty = !scores.isLoading && !scores.error && (scores.data?.length ?? 0) === 0;

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl
          refreshing={scores.isRefetching}
          onRefresh={() => scores.refetch()}
          tintColor={brandColors.gold}
        />
      }>
      <DiscoverSegmentHeader eyebrow={t('wallEyebrow')} title={t('wallTitle')} subtitle={t('wallSubtitle')} />

      {scores.isLoading ? (
        <ScreenLoadingBlock />
      ) : scores.error ? (
        <Card>
          <Body>{t('wallLoadError')}</Body>
          <Muted>{scores.error.message}</Muted>
        </Card>
      ) : empty ? (
        <Card>
          <Body>{t('feedEmptyState')}</Body>
        </Card>
      ) : (
        <>
          <DiscoverSectionTitle>{t('wallLast24')}</DiscoverSectionTitle>
          {last24.length === 0 ? (
            <Muted style={styles.emptyHint}>{t('wallEmptyDay')}</Muted>
          ) : (
            <View style={styles.carouselBleed}>
              <ScrollView
                horizontal
                nestedScrollEnabled
                showsHorizontalScrollIndicator={false}
                decelerationRate="fast"
                snapToOffsets={carouselSnapOffsets}
                snapToAlignment="start"
                disableIntervalMomentum
                keyboardShouldPersistTaps="handled"
                contentContainerStyle={styles.carouselContent}>
                {last24.map((item, index) => (
                  <View
                    key={item.id}
                    style={[
                      styles.carouselTileWrap,
                      index === last24.length - 1 && styles.carouselTileWrapLast,
                    ]}>
                    <PourGridCard
                      score={item}
                      hideVenueRow
                      tileWidth={carouselTileWidth}
                    />
                  </View>
                ))}
              </ScrollView>
            </View>
          )}

          <DiscoverSectionTitle style={discoverChromeStyles.sectionSpaced}>
            {t('wallTopWeek')}
          </DiscoverSectionTitle>
          <WallInsetList>
            {weekTop.length === 0 ? (
              <Muted style={styles.panelEmpty}>{t('wallTopWeekEmpty')}</Muted>
            ) : (
              weekTop.map((item, index) => (
                <PourListRow
                  key={item.id}
                  score={item}
                  showSeparatorBelow={index < weekTop.length - 1}
                />
              ))
            )}
          </WallInsetList>

          <DiscoverSectionTitle style={discoverChromeStyles.sectionSpaced}>
            {t('wallEarlier')}
          </DiscoverSectionTitle>
          <View style={styles.gridBlock}>
            {archiveRows.length === 0 ? (
              <Muted style={styles.emptyHint}>{t('wallArchiveEmpty')}</Muted>
            ) : (
              archiveRows.map((pair, rowIdx) => (
                <View key={`a-${rowIdx}`} style={styles.columnWrap}>
                  {pair.map((item) => (
                    <View key={item.id} style={styles.gridCell}>
                      <PourGridCard score={item} />
                    </View>
                  ))}
                  {pair.length === 1 ? <View style={styles.gridCell} /> : null}
                </View>
              ))
            )}
          </View>
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  content: {
    paddingHorizontal: SCREEN_EDGE_GUTTER,
    paddingTop: 4,
    paddingBottom: 132,
  },
  carouselBleed: {
    marginHorizontal: -SCREEN_EDGE_GUTTER,
  },
  carouselContent: {
    paddingHorizontal: SCREEN_EDGE_GUTTER,
    paddingVertical: 2,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  carouselTileWrap: {
    marginRight: CAROUSEL_GAP,
  },
  carouselTileWrapLast: {
    marginRight: 0,
  },
  insetList: {
    borderRadius: 16,
    backgroundColor: 'rgba(29, 24, 15, 0.5)',
    paddingHorizontal: 14,
    overflow: 'hidden',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: brandColors.borderSubtle,
  },
  gridBlock: {
    marginBottom: 4,
  },
  columnWrap: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  gridCell: {
    flex: 1,
    minWidth: 0,
  },
  panelEmpty: {
    paddingVertical: 16,
    paddingHorizontal: 2,
  },
  emptyHint: {
    marginBottom: 8,
  },
});
