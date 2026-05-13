import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { ActivityIndicator, Platform, StyleSheet, View } from 'react-native';
import MapView from 'react-native-maps';

import { PubListRow } from '@/components/pub/pub-list-row';
import { Card, Screen } from '@/components/split-the-g/screen';
import { Body, Eyebrow, Muted, Title } from '@/components/split-the-g/typography';
import { GOOGLE_MAP_DARK_STYLE } from '@/constants/google-dark-map-style';
import { brandColors } from '@/constants/theme';
import { fetchPubs } from '@/lib/api/client';
import { useLocale } from '@/lib/i18n/locale-context';

export default function PubsScreen() {
  const router = useRouter();
  const { t, tVars } = useLocale();
  const pubs = useQuery({
    queryKey: ['pubs'],
    queryFn: () => fetchPubs(50),
  });

  const listCount = pubs.data?.length ?? 0;

  return (
    <Screen contentContainerStyle={styles.screenContent}>
      <View style={styles.header}>
        <Eyebrow>{t('navPubs')}</Eyebrow>
        <Title>{t('pubsTitle')}</Title>
        <Muted>{t('pubsSubtitle')}</Muted>
      </View>

      <View style={styles.mapCard}>
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
      </View>

      {pubs.isLoading ? (
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

      {!pubs.isLoading && !pubs.error && listCount === 0 ? (
        <Card>
          <Body>{t('pubsEmptyDirectoryTitle')}</Body>
          <Muted>{t('pubsEmptyDirectoryBody')}</Muted>
        </Card>
      ) : null}

      {!pubs.isLoading && listCount > 0 ? (
        <View style={styles.listIntro}>
          <Eyebrow style={styles.listEyebrow}>
            {listCount === 1 ? t('pubsVenueOne') : tVars('pubsVenueMany', { count: listCount })}
          </Eyebrow>
        </View>
      ) : null}

      {(pubs.data ?? []).map((pub) => (
        <PubListRow
          key={pub.bar_key}
          pub={pub}
          onPress={() => router.push(`/pub/${encodeURIComponent(pub.bar_key)}`)}
        />
      ))}
    </Screen>
  );
}

const styles = StyleSheet.create({
  screenContent: {
    gap: 20,
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
