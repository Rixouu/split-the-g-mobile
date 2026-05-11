import { useQuery } from '@tanstack/react-query';
import { StyleSheet, View } from 'react-native';
import MapView from 'react-native-maps';

import { Card, Screen } from '@/components/split-the-g/screen';
import { Body, Eyebrow, Muted, Title } from '@/components/split-the-g/typography';
import { brandColors } from '@/constants/theme';
import { fetchPubs } from '@/lib/api/client';

export default function PubsScreen() {
  const pubs = useQuery({
    queryKey: ['pubs'],
    queryFn: () => fetchPubs(50),
  });

  return (
    <Screen>
      <View style={styles.header}>
        <Eyebrow>Pubs</Eyebrow>
        <Title>Find a Guinness nearby</Title>
        <Muted>Native maps replace Google Maps JavaScript and web embeds for mobile.</Muted>
      </View>

      <View style={styles.mapCard}>
        <MapView
          style={styles.map}
          initialRegion={{
            latitude: 13.7563,
            longitude: 100.5018,
            latitudeDelta: 0.12,
            longitudeDelta: 0.12,
          }}
        />
      </View>

      {pubs.error ? (
        <Card>
          <Body>Pub directory unavailable</Body>
          <Muted>{pubs.error.message}</Muted>
        </Card>
      ) : null}

      {(pubs.data ?? []).map((pub) => (
        <Card key={pub.bar_key}>
          <Body>{pub.display_name || 'Unnamed pub'}</Body>
          <Muted>{pub.sample_address || 'Address pending'}</Muted>
          <Muted>
            {pub.submission_count} pours · {pub.rating_count} ratings
            {pub.avg_pour_rating ? ` · ${pub.avg_pour_rating.toFixed(1)} avg` : ''}
          </Muted>
        </Card>
      ))}
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    gap: 10,
    paddingTop: 16,
  },
  mapCard: {
    overflow: 'hidden',
    height: 320,
    borderWidth: 1,
    borderColor: brandColors.border,
    borderRadius: 24,
    backgroundColor: brandColors.panel,
  },
  map: {
    flex: 1,
  },
});
