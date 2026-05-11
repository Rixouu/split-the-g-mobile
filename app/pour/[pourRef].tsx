import { useLocalSearchParams } from 'expo-router';
import { Image, Linking, Share, StyleSheet, View } from 'react-native';
import { useQuery } from '@tanstack/react-query';

import { AppButton } from '@/components/split-the-g/button';
import { Card, Screen } from '@/components/split-the-g/screen';
import { Body, Eyebrow, Muted, Title } from '@/components/split-the-g/typography';
import { brandColors } from '@/constants/theme';
import { absoluteWebUrl, fetchScoreByRef } from '@/lib/api/client';

function formatScore(value: number | null): string {
  if (typeof value !== 'number') return '--';
  return `${Math.round(value)}%`;
}

function formatWhen(iso: string | null | undefined): string {
  if (!iso) return '';
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
}

export default function PourDetailScreen() {
  const { pourRef: rawRef } = useLocalSearchParams<{ pourRef: string }>();
  const pourRef = (typeof rawRef === 'string' ? rawRef : rawRef?.[0] ?? '').trim();

  const score = useQuery({
    queryKey: ['score', pourRef],
    queryFn: () => fetchScoreByRef(pourRef),
    enabled: Boolean(pourRef),
  });

  const sharePath = score.data ? `/pour/${score.data.slug || score.data.id}` : `/pour/${pourRef}`;

  async function shareResult() {
    const url = absoluteWebUrl(sharePath);
    await Share.share({
      message: `Split The G result: ${url}`,
      url,
    });
  }

  async function openPlaceInMaps(placeId: string) {
    const url = `https://www.google.com/maps/search/?api=1&query_place_id=${encodeURIComponent(placeId)}`;
    const can = await Linking.canOpenURL(url);
    if (can) void Linking.openURL(url);
  }

  const d = score.data;

  return (
    <Screen>
      <View style={styles.header}>
        <Eyebrow>Pour result</Eyebrow>
        <Title>{formatScore(d?.split_score ?? null)}</Title>
        <Muted>{d?.username || 'Split The G drinker'}</Muted>
        {d?.created_at ? <Muted>{formatWhen(d.created_at)}</Muted> : null}
      </View>

      {score.isLoading ? (
        <Card>
          <Body>Loading pour…</Body>
        </Card>
      ) : null}

      {score.error ? (
        <Card>
          <Body>Could not load this pour</Body>
          <Muted>{score.error.message}</Muted>
        </Card>
      ) : null}

      {d ? (
        <>
          <Card>
            {d.pint_image_url ? (
              <Image source={{ uri: d.pint_image_url }} style={styles.imageMain} />
            ) : null}
            {d.split_image_url ? (
              <Image source={{ uri: d.split_image_url }} style={styles.imageSecondary} />
            ) : null}
            {d.g_closeup_image_url ? (
              <Image source={{ uri: d.g_closeup_image_url }} style={styles.imageSecondary} />
            ) : null}
            <Body>{[d.city, d.region, d.country].filter(Boolean).join(', ')}</Body>
            {(d.bar_name || d.bar_address) && (
              <Body style={styles.mt}>
                {[d.bar_name, d.bar_address].filter(Boolean).join(' · ')}
              </Body>
            )}
            {typeof d.pour_rating === 'number' ? (
              <Body style={styles.mt}>Pour rating (1–5): {d.pour_rating.toFixed(1)}</Body>
            ) : null}
            {typeof d.pint_price === 'number' ? (
              <Body style={styles.mt}>Pint price recorded: {d.pint_price}</Body>
            ) : null}
            <Muted style={styles.mt}>{absoluteWebUrl(sharePath)}</Muted>
            <AppButton label="Share result" onPress={shareResult} />
            {d.google_place_id ? (
              <AppButton
                label="Open place in Google Maps"
                variant="secondary"
                onPress={() => openPlaceInMaps(d.google_place_id!)}
              />
            ) : null}
          </Card>
          <Card>
            <Body>Web-only on this pour</Body>
            <Muted>
              The web `score` route adds all-time / weekly rank, attaching a competition from the URL, Places autocomplete
              to set or fix the venue, editable pour rating and price, share panels, and post-OAuth return flows. None of
              that is wired in native UI yet—this screen is read-only plus share / maps.
            </Muted>
          </Card>
        </>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    gap: 10,
    paddingTop: 16,
  },
  imageMain: {
    width: '100%',
    height: 360,
    borderRadius: 24,
    backgroundColor: brandColors.panelMuted,
    marginBottom: 12,
  },
  imageSecondary: {
    width: '100%',
    height: 220,
    borderRadius: 18,
    backgroundColor: brandColors.panelMuted,
    marginBottom: 12,
  },
  mt: {
    marginTop: 10,
  },
});
