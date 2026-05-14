import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { Platform, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';

import { PourGridCard } from '@/components/split-the-g/pour-grid-card';
import { PourListRow } from '@/components/split-the-g/pour-list-row';
import { Card } from '@/components/split-the-g/screen';
import { Body, Eyebrow, Muted, Title } from '@/components/split-the-g/typography';
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

export function WallFeedBody() {
  const { t } = useLocale();
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
      <View style={styles.header}>
        <Eyebrow>{t('wallEyebrow')}</Eyebrow>
        <Title>{t('wallTitle')}</Title>
        <Muted>{t('wallSubtitle')}</Muted>
      </View>

      {scores.isLoading ? (
        <Card>
          <Body>{t('commonLoading')}</Body>
        </Card>
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
          <Text style={styles.sectionTitle}>{t('wallLast24')}</Text>
          {last24.length === 0 ? (
            <Muted style={styles.emptyHint}>{t('wallEmptyDay')}</Muted>
          ) : (
            <View style={styles.gridBlock}>
              {chunkPairs(last24).map((pair, rowIdx) => (
                <View key={`d-${rowIdx}`} style={styles.columnWrap}>
                  {pair.map((item) => (
                    <View key={item.id} style={styles.gridCell}>
                      <PourGridCard score={item} />
                    </View>
                  ))}
                  {pair.length === 1 ? <View style={styles.gridCell} /> : null}
                </View>
              ))}
            </View>
          )}

          <Text style={[styles.sectionTitle, styles.sectionSpaced]}>{t('wallTopWeek')}</Text>
          <View style={styles.listPanel}>
            {weekTop.length === 0 ? (
              <Muted style={styles.panelEmpty}>{t('wallTopWeekEmpty')}</Muted>
            ) : (
              weekTop.map((item) => <PourListRow key={item.id} score={item} />)
            )}
          </View>

          <Text style={[styles.sectionTitle, styles.sectionSpaced]}>{t('wallEarlier')}</Text>
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
  header: {
    marginBottom: 18,
    gap: 10,
    paddingTop: 16,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    color: brandColors.goldBright,
    marginBottom: 10,
    ...(Platform.OS === 'android' ? { includeFontPadding: false } : {}),
  },
  sectionSpaced: {
    marginTop: 22,
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
  listPanel: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: brandColors.pourCardStroke,
    backgroundColor: 'rgba(29, 24, 15, 0.35)',
    paddingVertical: 10,
    paddingHorizontal: 10,
    gap: 8,
  },
  panelEmpty: {
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  emptyHint: {
    marginBottom: 8,
  },
});
