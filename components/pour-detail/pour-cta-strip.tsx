import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { Alert, Linking, Share, StyleSheet, View } from 'react-native';

import { AppButton } from '@/components/split-the-g/button';
import { Muted } from '@/components/split-the-g/typography';
import { useLocale } from '@/lib/i18n/locale-context';

const BMC_URL = 'https://buymeacoffee.com/rixou';

interface PourCtaStripProps {
  shareMessage: string;
  webUrl: string;
  pubPageBarKey: string | null;
  googlePlaceId: string | null;
}

export function PourCtaStrip({ shareMessage, webUrl, pubPageBarKey, googlePlaceId }: PourCtaStripProps) {
  const router = useRouter();
  const { t } = useLocale();

  async function onShare() {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await Share.share({
      message: shareMessage,
      url: webUrl,
    });
  }

  async function onCopy() {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await Clipboard.setStringAsync(webUrl);
    Alert.alert(t('pourCopyLink'), t('pourLinkCopied'));
  }

  async function onMaps() {
    if (!googlePlaceId) return;
    const url = `https://www.google.com/maps/search/?api=1&query_place_id=${encodeURIComponent(googlePlaceId)}`;
    const can = await Linking.canOpenURL(url);
    if (can) void Linking.openURL(url);
  }

  async function onBmc() {
    const can = await Linking.canOpenURL(BMC_URL);
    if (can) void Linking.openURL(BMC_URL);
  }

  return (
    <View style={styles.wrap}>
      <AppButton label={t('pourShareResult')} onPress={onShare} />
      <AppButton label={t('pourCopyLink')} variant="secondary" onPress={onCopy} />
      <AppButton label={t('pourLeaderboard')} variant="secondary" onPress={() => router.push('/leaderboard')} />
      {pubPageBarKey ? (
        <AppButton
          label={t('pourViewPub')}
          variant="secondary"
          onPress={() => router.push(`/pub/${encodeURIComponent(pubPageBarKey)}`)}
        />
      ) : null}
      {googlePlaceId ? (
        <AppButton label={t('pourOpenInMaps')} variant="secondary" onPress={onMaps} />
      ) : null}
      <AppButton label={t('pourBuyCreatorBeer')} variant="secondary" onPress={onBmc} />
      <Muted style={styles.url} numberOfLines={2}>
        {webUrl}
      </Muted>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: 10,
  },
  url: {
    marginTop: 4,
  },
});
