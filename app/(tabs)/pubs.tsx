import { useQueries, useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState, type ReactElement } from 'react';
import {
  FlatList,
  InteractionManager,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  type ListRenderItem,
} from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import { SafeAreaView } from 'react-native-safe-area-context';

import { PubGoldMapPin } from '@/components/pub/pub-gold-map-pin';
import { PubListRow } from '@/components/pub/pub-list-row';
import { Card } from '@/components/split-the-g/screen';
import { ScreenLoadingBlock } from '@/components/split-the-g/screen-loading';
import { Body, Eyebrow, Muted, Title } from '@/components/split-the-g/typography';
import { SCREEN_EDGE_GUTTER } from '@/constants/layout';
import { GOOGLE_MAP_DARK_STYLE } from '@/constants/google-dark-map-style';
import { brandColors } from '@/constants/theme';
import { fetchPubs } from '@/lib/api/client';
import type { PubSummary } from '@/lib/api/types';
import { resolvePubMapCoords } from '@/lib/pub/resolve-pub-map-coords';
import { useLocale } from '@/lib/i18n/locale-context';

const LIST_BOTTOM_PADDING = 132;
const ROW_GAP = 20;

type PubsSortMode = 'recommended' | 'name' | 'pours';

function filterAndSortPubs(directory: PubSummary[], search: string, sort: PubsSortMode): PubSummary[] {
  const q = search.trim().toLowerCase();
  let out =
    q === ''
      ? directory
      : directory.filter((p) => {
          const name = p.display_name.trim().toLowerCase();
          const addr = (p.sample_address ?? '').toLowerCase();
          return name.includes(q) || addr.includes(q);
        });
  if (sort === 'name') {
    out = [...out].sort((a, b) =>
      a.display_name.trim().localeCompare(b.display_name.trim(), undefined, { sensitivity: 'base' }),
    );
  } else if (sort === 'pours') {
    out = [...out].sort((a, b) => b.submission_count - a.submission_count);
  }
  return out;
}

export default function PubsScreen() {
  const router = useRouter();
  const { t, tVars } = useLocale();
  const [mapMounted, setMapMounted] = useState(false);
  const [pubSearch, setPubSearch] = useState('');
  const [sortMode, setSortMode] = useState<PubsSortMode>('recommended');
  const mapRef = useRef<MapView>(null);

  const pubs = useQuery({
    queryKey: ['pubs'],
    queryFn: () => fetchPubs(50),
    staleTime: 900_000,
  });

  useEffect(() => {
    const task = InteractionManager.runAfterInteractions(() => {
      setMapMounted(true);
    });
    return () => task.cancel();
  }, []);

  const directoryRows = useMemo(() => pubs.data ?? [], [pubs.data]);
  const directoryCount = directoryRows.length;

  const filteredRows = useMemo(
    () => filterAndSortPubs(directoryRows, pubSearch, sortMode),
    [directoryRows, pubSearch, sortMode],
  );
  const filteredCount = filteredRows.length;

  const coordQueries = useQueries({
    queries: filteredRows.map((pub) => ({
      queryKey: ['pub-summary-coords', pub.bar_key, pub.google_place_id, pub.display_name, pub.sample_address],
      queryFn: () =>
        resolvePubMapCoords(pub.google_place_id ?? null, pub.display_name.trim(), pub.sample_address ?? null),
      staleTime: 86_400_000,
      enabled: mapMounted && filteredRows.length > 0 && Boolean(pub.display_name?.trim()),
    })),
  });

  const markerCoords = useMemo(() => {
    const out: { barKey: string; lat: number; lng: number }[] = [];
    for (let i = 0; i < filteredRows.length; i++) {
      const d = coordQueries[i]?.data;
      const pub = filteredRows[i];
      if (d != null && Number.isFinite(d.lat) && Number.isFinite(d.lng)) {
        out.push({ barKey: pub.bar_key, lat: d.lat, lng: d.lng });
      }
    }
    return out;
  }, [filteredRows, coordQueries]);

  useEffect(() => {
    if (!mapMounted || markerCoords.length === 0) return;
    const coords = markerCoords.map((m) => ({ latitude: m.lat, longitude: m.lng }));
    const frame = requestAnimationFrame(() => {
      const mv = mapRef.current;
      if (!mv) return;
      if (coords.length === 1) {
        void mv.animateToRegion(
          {
            latitude: coords[0].latitude,
            longitude: coords[0].longitude,
            latitudeDelta: 0.07,
            longitudeDelta: 0.07,
          },
          380,
        );
      } else {
        mv.fitToCoordinates(coords, {
          edgePadding: { top: 32, right: 24, bottom: 38, left: 24 },
          animated: true,
        });
      }
    });
    return () => cancelAnimationFrame(frame);
  }, [mapMounted, markerCoords]);

  const navigateToPub = useCallback(
    (barKey: string) => {
      router.push(`/pub/${encodeURIComponent(barKey)}`);
    },
    [router],
  );

  const renderItem = useCallback<ListRenderItem<PubSummary>>(
    ({ item }) => (
      <PubListRow pub={item} onPress={() => navigateToPub(item.bar_key)} />
    ),
    [navigateToPub],
  );

  const listSeparator = useCallback(() => <View style={{ height: ROW_GAP }} />, []);

  const sortOptions = useMemo(
    () =>
      [
        { mode: 'recommended' as const, label: t('pubsSortRecommended') },
        { mode: 'name' as const, label: t('pubsSortName') },
        { mode: 'pours' as const, label: t('pubsSortPours') },
      ] as const,
    [t],
  );

  const listHeader = useMemo((): ReactElement => {
    return (
      <View style={styles.headerBlock}>
        <View style={styles.header}>
          <Eyebrow>{t('navPubs')}</Eyebrow>
          <Title>{t('pubsTitle')}</Title>
          <Muted>{t('pubsSubtitle')}</Muted>
        </View>

        <View style={styles.mapCard}>
          {mapMounted ? (
            <MapView
              ref={mapRef}
              style={styles.map}
              mapType={Platform.OS === 'ios' ? 'mutedStandard' : 'standard'}
              customMapStyle={Platform.OS === 'android' ? GOOGLE_MAP_DARK_STYLE : undefined}
              pitchEnabled={false}
              toolbarEnabled={false}
              showsPointsOfInterest={false}
              initialRegion={{
                latitude: 13.7563,
                longitude: 100.5018,
                latitudeDelta: 0.12,
                longitudeDelta: 0.12,
              }}>
              {markerCoords.map((m) => (
                <Marker
                  key={m.barKey}
                  coordinate={{ latitude: m.lat, longitude: m.lng }}
                  anchor={{ x: 0.5, y: 0.5 }}
                  onPress={() => navigateToPub(m.barKey)}>
                  <PubGoldMapPin />
                </Marker>
              ))}
            </MapView>
          ) : (
            <View style={styles.mapPlaceholder}>
              <ScreenLoadingBlock showCaption={false} dense style={styles.mapPlaceholderLoading} />
            </View>
          )}
        </View>

        {pubs.isPending && directoryCount === 0 ? (
          <ScreenLoadingBlock label={t('pubsLoadingDirectory')} dense style={styles.loadingBlock} />
        ) : null}

        {pubs.error ? (
          <Card>
            <Body>{t('pubsDirectoryUnavailableTitle')}</Body>
            <Muted>{pubs.error.message}</Muted>
          </Card>
        ) : null}

        {!pubs.isPending && !pubs.error && directoryCount === 0 ? (
          <Card>
            <Body>{t('pubsEmptyDirectoryTitle')}</Body>
            <Muted>{t('pubsEmptyDirectoryBody')}</Muted>
          </Card>
        ) : null}

        {!pubs.isPending && directoryCount > 0 ? (
          <View style={styles.filterSection}>
            <TextInput
              value={pubSearch}
              onChangeText={setPubSearch}
              placeholder={t('pubsSearchPlaceholder')}
              placeholderTextColor={brandColors.tanMuted}
              style={styles.searchInput}
              autoCorrect={false}
              autoCapitalize="none"
              accessibilityLabel={t('pubsSearchAccessibilityLabel')}
            />
            <View style={styles.sortRow}>
              {sortOptions.map(({ mode, label }) => (
                <Pressable
                  key={mode}
                  accessibilityRole="button"
                  accessibilityState={{ selected: sortMode === mode }}
                  hitSlop={6}
                  onPress={() => setSortMode(mode)}
                  style={[styles.sortChip, sortMode === mode && styles.sortChipActive]}>
                  <Text style={[styles.sortChipLabel, sortMode === mode && styles.sortChipLabelActive]}>{label}</Text>
                </Pressable>
              ))}
            </View>
          </View>
        ) : null}

        {!pubs.isPending && filteredCount > 0 ? (
          <View style={styles.listIntro}>
            <Eyebrow style={styles.listEyebrow}>
              {filteredCount === 1 ? t('pubsVenueOne') : tVars('pubsVenueMany', { count: filteredCount })}
            </Eyebrow>
            {filteredCount !== directoryCount ? (
              <Muted style={styles.filteredHint}>
                {tVars('pubsVenueFilteredHint', { shown: filteredCount, total: directoryCount })}
              </Muted>
            ) : null}
          </View>
        ) : null}
      </View>
    );
  }, [
    directoryCount,
    filteredCount,
    mapMounted,
    markerCoords,
    navigateToPub,
    pubSearch,
    pubs.error,
    pubs.isPending,
    sortMode,
    sortOptions,
    t,
    tVars,
  ]);

  const listEmptyFiltered = useMemo(() => {
    if (pubs.isPending || pubs.error || directoryCount === 0 || filteredCount > 0) return null;
    return (
      <View style={styles.emptyFiltered}>
        <Muted>{t('pubsSearchNoMatches')}</Muted>
      </View>
    );
  }, [directoryCount, filteredCount, pubs.error, pubs.isPending, t]);

  const keyExtractor = useCallback((item: PubSummary) => item.bar_key, []);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <FlatList
        data={filteredRows}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        ItemSeparatorComponent={listSeparator}
        ListHeaderComponent={listHeader}
        ListEmptyComponent={listEmptyFiltered}
        contentContainerStyle={styles.listContent}
        removeClippedSubviews={Platform.OS === 'android'}
        windowSize={7}
        maxToRenderPerBatch={8}
        initialNumToRender={8}
        keyboardDismissMode="on-drag"
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: brandColors.black,
  },
  listContent: {
    paddingHorizontal: SCREEN_EDGE_GUTTER,
    paddingTop: 4,
    paddingBottom: LIST_BOTTOM_PADDING,
    flexGrow: 1,
  },
  headerBlock: {
    paddingBottom: 0,
    gap: ROW_GAP,
  },
  header: {
    gap: 10,
    paddingTop: 16,
  },
  mapCard: {
    overflow: 'hidden',
    height: 280,
    borderWidth: 1,
    borderColor: brandColors.frame,
    borderRadius: 16,
    backgroundColor: brandColors.panel,
  },
  map: {
    flex: 1,
  },
  mapPlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mapPlaceholderLoading: {
    paddingVertical: 0,
  },
  loadingBlock: {
    paddingVertical: 8,
  },
  filterSection: {
    gap: 12,
    marginTop: 0,
  },
  searchInput: {
    borderWidth: 1,
    borderColor: brandColors.frame,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: Platform.select({ ios: 12, default: 10 }),
    color: brandColors.cream,
    fontSize: 16,
    backgroundColor: 'rgba(11, 11, 11, 0.35)',
  },
  sortRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  sortChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: brandColors.frame,
    backgroundColor: 'rgba(11, 11, 11, 0.28)',
  },
  sortChipActive: {
    borderColor: brandColors.goldBright,
    backgroundColor: 'rgba(179, 139, 45, 0.12)',
  },
  sortChipLabel: {
    color: brandColors.tanMuted,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
  sortChipLabelActive: {
    color: brandColors.goldBright,
  },
  listIntro: {
    gap: 6,
    paddingBottom: 14,
    marginTop: -4,
  },
  listEyebrow: {
    letterSpacing: 1.8,
  },
  filteredHint: {
    fontSize: 13,
    lineHeight: 18,
    marginTop: 2,
  },
  emptyFiltered: {
    paddingTop: 8,
    paddingBottom: 24,
  },
});
