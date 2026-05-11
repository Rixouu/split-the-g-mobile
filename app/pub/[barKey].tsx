import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import * as WebBrowser from 'expo-web-browser';
import { Linking, StyleSheet, View } from 'react-native';

import { AppButton } from '@/components/split-the-g/button';
import { Card, Screen } from '@/components/split-the-g/screen';
import { Body, Eyebrow, Muted, Title } from '@/components/split-the-g/typography';
import { absoluteWebUrl, fetchPubByBarKey } from '@/lib/api/client';
import { useLocale } from '@/lib/i18n/locale-context';

export default function PubDetailScreen() {
  const router = useRouter();
  const { t } = useLocale();
  const { barKey: rawKey } = useLocalSearchParams<{ barKey: string }>();
  const barKey =
    decodeURIComponent(
      typeof rawKey === 'string' ? rawKey : Array.isArray(rawKey) ? (rawKey[0] ?? '') : '',
    ).trim() || '';

  const q = useQuery({
    queryKey: ['pub', barKey],
    queryFn: () => fetchPubByBarKey(barKey),
    enabled: Boolean(barKey),
  });

  const pub = q.data;
  const webPubUrl = absoluteWebUrl(`/pubs/${encodeURIComponent(barKey)}`);

  async function openInMaps() {
    if (!pub?.google_place_id) return;
    const url = `https://www.google.com/maps/search/?api=1&query_place_id=${encodeURIComponent(pub.google_place_id)}`;
    const can = await Linking.canOpenURL(url);
    if (can) void Linking.openURL(url);
  }

  async function openWebDetail() {
    await WebBrowser.openBrowserAsync(webPubUrl);
  }

  return (
    <Screen>
      <View style={styles.header}>
        <Eyebrow>{t('pubEyebrow')}</Eyebrow>
        {pub ? <Title>{pub.display_name || t('pubTitleFallback')}</Title> : <Title>…</Title>}
        {pub?.sample_address ? <Muted>{pub.sample_address}</Muted> : null}
      </View>

      {q.isLoading ? (
        <Card>
          <Body>{t('commonLoading')}</Body>
        </Card>
      ) : null}

      {q.error ? (
        <Card>
          <Body>{t('pubLoadError')}</Body>
          <Muted>{q.error.message}</Muted>
        </Card>
      ) : null}

      {!q.isLoading && !q.error && !pub ? (
        <Card>
          <Body>{t('pubNotFoundHint')}</Body>
        </Card>
      ) : null}

      {pub ? (
        <Card>
          <Body>
            {pub.submission_count} pours recorded · {pub.rating_count} ratings
            {pub.avg_pour_rating != null ? ` · ${pub.avg_pour_rating.toFixed(1)} avg pour rating` : ''}
          </Body>
          <Muted style={styles.mt}>
            Native detail is limited to `bar_pub_stats`. The web pub page adds favorites, wall tab, promos, opening hours,
            spend stats, and admin/import tools (`pubs.$barKey`).
          </Muted>
          {pub.google_place_id ? (
            <AppButton label={t('pourOpenInMaps')} variant="secondary" onPress={openInMaps} />
          ) : null}
          <AppButton label="View full page on the web" variant="secondary" onPress={openWebDetail} />
        </Card>
      ) : null}

      <Card>
        <Body>Claiming, advertising, or importing venue data</Body>
        <Muted>
          On the web, venue owners use mailto / banners on `/pubs` and admin sections on the pub detail page. There is no
          separate `/pubs/new` route—workflows are embedded in `pubs` and `pubs/:barKey`.
        </Muted>
        <AppButton
          label="Open pubs on the web"
          variant="secondary"
          onPress={() => {
            void Linking.openURL(absoluteWebUrl('/pubs'));
          }}
        />
      </Card>

      <AppButton label={t('actionBack')} variant="secondary" onPress={() => router.back()} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    gap: 10,
    paddingTop: 16,
  },
  mt: {
    marginTop: 12,
  },
});
