import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useState, type ReactElement } from 'react';
import {
  ActivityIndicator,
  FlatList,
  InteractionManager,
  Platform,
  StyleSheet,
  View,
  type ListRenderItem,
} from 'react-native';
import MapView from 'react-native-maps';
import { SafeAreaView } from 'react-native-safe-area-context';

import { PubListRow } from '@/components/pub/pub-list-row';
import { Card } from '@/components/split-the-g/screen';
import { Body, Eyebrow, Muted, Title } from '@/components/split-the-g/typography';
import { SCREEN_EDGE_GUTTER } from '@/constants/layout';
import { GOOGLE_MAP_DARK_STYLE } from '@/constants/google-dark-map-style';
import { brandColors } from '@/constants/theme';
import { fetchPubs } from '@/lib/api/client';
import type { PubSummary } from '@/lib/api/types';
import { useLocale } from '@/lib/i18n/locale-context';

const LIST_BOTTOM_PADDING = 132;
const ROW_GAP = 20;

export default function PubsScreen() {
  const router = useRouter();
  const { t, tVars } = useLocale();
  const [mapMounted, setMapMounted] = useState(false);

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

  const rows = pubs.data ?? [];
  const listCount = rows.length;

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
              }}
            />
          ) : (
            <View style={styles.mapPlaceholder} accessibilityRole="progressbar">
              <ActivityIndicator color={brandColors.goldBright} />
            </View>
          )}
        </View>

        {pubs.isPending && listCount === 0 ? (
          <View style={styles.loadingBlock} accessibilityRole="progressbar">
            <ActivityIndicator color={brandColors.goldBright} size="large" />
            <Muted style={styles.loadingCaption}>{t('pubsLoadingDirectory')}</Muted>
          </View>
        ) : null}

        {pubs.error ? (
          <Card>
            <Body>{t('pubsDirectoryUnavailableTitle')}</Body>
            <Muted>{pubs.error.message}</Muted>
          </Card>
        ) : null}

        {!pubs.isPending && !pubs.error && listCount === 0 ? (
          <Card>
            <Body>{t('pubsEmptyDirectoryTitle')}</Body>
            <Muted>{t('pubsEmptyDirectoryBody')}</Muted>
          </Card>
        ) : null}

        {!pubs.isPending && listCount > 0 ? (
          <View style={styles.listIntro}>
            <Eyebrow style={styles.listEyebrow}>
              {listCount === 1 ? t('pubsVenueOne') : tVars('pubsVenueMany', { count: listCount })}
            </Eyebrow>
          </View>
        ) : null}
      </View>
    );
  }, [mapMounted, pubs.error, pubs.isPending, listCount, t, tVars]);

  const keyExtractor = useCallback((item: PubSummary) => item.bar_key, []);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <FlatList
        data={rows}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        ItemSeparatorComponent={listSeparator}
        ListHeaderComponent={listHeader}
        contentContainerStyle={styles.listContent}
        removeClippedSubviews={Platform.OS === 'android'}
        windowSize={7}
        maxToRenderPerBatch={8}
        initialNumToRender={8}
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
  loadingBlock: {
    alignItems: 'center',
    gap: 12,
    paddingVertical: 8,
  },
  loadingCaption: {
    fontSize: 13,
    textAlign: 'center',
  },
  listIntro: {
    marginTop: -4,
    marginBottom: -8,
  },
  listEyebrow: {
    letterSpacing: 1.8,
  },
});
