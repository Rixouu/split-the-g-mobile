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

function directoryCachedCoords(pub: PubSummary): { lat: number; lng: number } | null {
  if (
    pub.directory_latitude == null ||
    pub.directory_longitude == null ||
    !Number.isFinite(pub.directory_latitude) ||
    !Number.isFinite(pub.directory_longitude)
  ) {
    return null;
  }
  return { lat: pub.directory_latitude, lng: pub.directory_longitude };
}

function canResolveCoordsWithoutCache(pub: PubSummary): boolean {
  return (
    Boolean(pub.google_place_id?.trim()) ||
    Boolean(pub.maps_place_url?.trim()) ||
    Boolean(pub.display_name?.trim()) ||
    Boolean(pub.sample_address?.trim())
  );
}

type PubsSortMode = 'recommended' | 'name' | 'pours';
type MappedPub = { pub: PubSummary; lat: number; lng: number };

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
  const [selectedBarKey, setSelectedBarKey] = useState<string | null>(null);
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
    queries: filteredRows.map((pub) => {
      const cached = directoryCachedCoords(pub);
      return {
        queryKey: [
          'pub-summary-coords',
          pub.bar_key,
          pub.google_place_id,
          pub.display_name,
          pub.sample_address,
          pub.maps_place_url,
          pub.directory_latitude,
          pub.directory_longitude,
        ],
        queryFn: () =>
          resolvePubMapCoords(
            pub.google_place_id ?? null,
            pub.display_name?.trim() ?? '',
            pub.sample_address ?? null,
            pub.maps_place_url ?? null,
            cached,
          ),
        staleTime: 86_400_000,
        enabled:
          mapMounted &&
          filteredRows.length > 0 &&
          cached == null &&
          canResolveCoordsWithoutCache(pub),
      };
    }),
  });

  const markerCoords = useMemo(() => {
    const out: MappedPub[] = [];
    for (let i = 0; i < filteredRows.length; i++) {
      const pub = filteredRows[i];
      const fromQuery = coordQueries[i]?.data;
      const fromDirectory = directoryCachedCoords(pub);
      const coords = fromQuery ?? fromDirectory;
      if (coords != null && Number.isFinite(coords.lat) && Number.isFinite(coords.lng)) {
        out.push({ pub, lat: coords.lat, lng: coords.lng });
      }
    }
    return out;
  }, [filteredRows, coordQueries]);

  const selectedMapPub = useMemo(
    () => markerCoords.find((marker) => marker.pub.bar_key === selectedBarKey) ?? markerCoords[0] ?? null,
    [markerCoords, selectedBarKey],
  );

  useEffect(() => {
    if (markerCoords.length === 0) {
      setSelectedBarKey(null);
      return;
    }
    if (!markerCoords.some((marker) => marker.pub.bar_key === selectedBarKey)) {
      setSelectedBarKey(markerCoords[0].pub.bar_key);
    }
  }, [markerCoords, selectedBarKey]);

  const fitMapToMarkers = useCallback(() => {
    if (!mapMounted || markerCoords.length === 0) return;
    const coords = markerCoords.map((m) => ({ latitude: m.lat, longitude: m.lng }));
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
      return;
    }
    mv.fitToCoordinates(coords, {
      edgePadding: { top: 52, right: 28, bottom: 118, left: 28 },
      animated: true,
    });
  }, [mapMounted, markerCoords]);

  useEffect(() => {
    const id = requestAnimationFrame(() => fitMapToMarkers());
    return () => cancelAnimationFrame(id);
  }, [fitMapToMarkers]);

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
            <>
              <MapView
                ref={mapRef}
                style={styles.map}
                mapType={Platform.OS === 'ios' ? 'mutedStandard' : 'standard'}
                customMapStyle={Platform.OS === 'android' ? GOOGLE_MAP_DARK_STYLE : undefined}
                pitchEnabled={false}
                rotateEnabled={false}
                toolbarEnabled={false}
                showsBuildings={false}
                showsCompass={false}
                showsPointsOfInterest={false}
                onMapReady={fitMapToMarkers}
                initialRegion={{
                  latitude: 13.7563,
                  longitude: 100.5018,
                  latitudeDelta: 0.12,
                  longitudeDelta: 0.12,
                }}>
                {markerCoords.map((marker) => {
                  const pubTitle = marker.pub.display_name.trim() || t('pubsCardUnnamed');
                  return (
                    <Marker
                      key={`${marker.pub.bar_key}:${marker.lat}:${marker.lng}`}
                      coordinate={{ latitude: marker.lat, longitude: marker.lng }}
                      anchor={{ x: 0.5, y: 1 }}
                      title={pubTitle}
                      description={marker.pub.sample_address?.trim() || undefined}
                      tracksViewChanges
                      onPress={() => setSelectedBarKey(marker.pub.bar_key)}>
                      <PubGoldMapPin label={pubTitle} selected={selectedMapPub?.pub.bar_key === marker.pub.bar_key} />
                    </Marker>
                  );
                })}
              </MapView>

              <View pointerEvents="none" style={styles.mapStatus}>
                <Text style={styles.mapStatusLabel}>
                  {tVars('pubsMapVenueCount', { count: markerCoords.length })}
                </Text>
                <Text style={styles.mapStatusHint}>{t('pubsMapHint')}</Text>
              </View>

              {selectedMapPub ? (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={tVars('pubsMapOpenVenueAccessibilityLabel', {
                    pub: selectedMapPub.pub.display_name.trim() || t('pubsCardUnnamed'),
                  })}
                  onPress={() => navigateToPub(selectedMapPub.pub.bar_key)}
                  style={({ pressed }) => [styles.mapPreview, pressed && styles.mapPreviewPressed]}>
                  <View style={styles.mapPreviewBody}>
                    <Text style={styles.mapPreviewTitle} numberOfLines={1}>
                      {selectedMapPub.pub.display_name.trim() || t('pubsCardUnnamed')}
                    </Text>
                    <Text style={styles.mapPreviewAddress} numberOfLines={1}>
                      {selectedMapPub.pub.sample_address?.trim() || t('pubsCardAddressPending')}
                    </Text>
                  </View>
                  <Text style={styles.mapPreviewAction}>{t('pubsMapOpenVenue')}</Text>
                </Pressable>
              ) : (
                <View pointerEvents="none" style={styles.mapEmptyState}>
                  <Text style={styles.mapEmptyTitle}>{t('pubsMapNoLocations')}</Text>
                  <Text style={styles.mapEmptyBody}>{t('pubsMapNoLocationsHint')}</Text>
                </View>
              )}
            </>
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
    fitMapToMarkers,
    mapMounted,
    markerCoords,
    navigateToPub,
    selectedMapPub,
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
    position: 'relative',
    overflow: 'hidden',
    height: 314,
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
  mapStatus: {
    position: 'absolute',
    top: 12,
    left: 12,
    right: 12,
    alignSelf: 'flex-start',
    gap: 2,
  },
  mapStatusLabel: {
    alignSelf: 'flex-start',
    borderRadius: 999,
    paddingHorizontal: 9,
    paddingVertical: 5,
    overflow: 'hidden',
    backgroundColor: 'rgba(11, 11, 11, 0.84)',
    color: brandColors.goldBright,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.7,
    textTransform: 'uppercase',
  },
  mapStatusHint: {
    alignSelf: 'flex-start',
    maxWidth: '94%',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    overflow: 'hidden',
    backgroundColor: 'rgba(11, 11, 11, 0.7)',
    color: 'rgba(253, 251, 243, 0.82)',
    fontSize: 11,
    fontWeight: '600',
  },
  mapPreview: {
    position: 'absolute',
    right: 10,
    bottom: 10,
    left: 10,
    minHeight: 68,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 11,
    borderWidth: 1,
    borderColor: 'rgba(197, 160, 89, 0.68)',
    borderRadius: 12,
    backgroundColor: 'rgba(11, 11, 11, 0.92)',
  },
  mapPreviewPressed: {
    opacity: 0.9,
  },
  mapPreviewBody: {
    flex: 1,
    minWidth: 0,
    gap: 3,
  },
  mapPreviewTitle: {
    color: brandColors.cream,
    fontSize: 15,
    fontWeight: '800',
  },
  mapPreviewAddress: {
    color: brandColors.tanMuted,
    fontSize: 12,
  },
  mapPreviewAction: {
    color: brandColors.goldBright,
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.45,
  },
  mapEmptyState: {
    position: 'absolute',
    right: 12,
    bottom: 12,
    left: 12,
    gap: 3,
    paddingHorizontal: 13,
    paddingVertical: 11,
    borderRadius: 12,
    backgroundColor: 'rgba(11, 11, 11, 0.88)',
  },
  mapEmptyTitle: {
    color: brandColors.cream,
    fontSize: 14,
    fontWeight: '700',
  },
  mapEmptyBody: {
    color: brandColors.tanMuted,
    fontSize: 12,
    lineHeight: 17,
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
