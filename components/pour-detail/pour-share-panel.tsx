import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { Image } from 'expo-image';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Linking, Pressable, Share, StyleSheet, Text, View } from 'react-native';

import { AppButton } from '@/components/split-the-g/button';
import { Body, Muted } from '@/components/split-the-g/typography';
import { brandColors } from '@/constants/theme';
import type { PourRankContext } from '@/lib/api/types';
import { buildPourTelegramBlurb, buildPourTweetText, getPourShareHookLine } from '@/lib/i18n/translations';
import { useLocale } from '@/lib/i18n/locale-context';

const logoAsset = require('../../assets/images/logo-splittheg.png');
const BMC_URL = 'https://buymeacoffee.com/rixou';

const stroke = brandColors.pourCardStroke;

interface PourSharePanelProps {
  shareMessage: string;
  webUrl: string;
  splitScore: number;
  rank: PourRankContext | null;
  previewImageUrl: string | null;
  pubPageBarKey: string | null;
  googlePlaceId: string | null;
}

function replaceRankTemplate(template: string, rank: number, total: number): string {
  return template.replace(/\{rank\}/g, String(rank)).replace(/\{total\}/g, String(total));
}

export function PourSharePanel({
  shareMessage,
  webUrl,
  splitScore,
  rank,
  previewImageUrl,
  pubPageBarKey,
  googlePlaceId,
}: PourSharePanelProps) {
  const router = useRouter();
  const { t, tVars, locale } = useLocale();
  const [copied, setCopied] = useState<'text' | 'link' | null>(null);

  useEffect(() => {
    if (!copied) return;
    const tmr = setTimeout(() => setCopied(null), 2000);
    return () => clearTimeout(tmr);
  }, [copied]);

  const scoreLabel = splitScore.toFixed(2);
  const hook = getPourShareHookLine(locale, splitScore);

  const rankAllTimeLine = rank
    ? replaceRankTemplate(t('pourShareRankAllTime'), rank.allTimeRank, rank.totalSplits)
    : '—';
  const rankWeekLine = rank
    ? replaceRankTemplate(t('pourShareRankWeek'), rank.weeklyRank, rank.weeklyTotalSplits)
    : '—';

  const tweetText = useMemo(
    () => buildPourTweetText(locale, { shareUrl: webUrl, splitScore }),
    [locale, webUrl, splitScore],
  );

  const telegramBlurb = useMemo(() => buildPourTelegramBlurb(locale, splitScore), [locale, splitScore]);

  const mailtoHref = useMemo(() => {
    const subject = tVars('pourShareMailSubject', { score: scoreLabel });
    return `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(shareMessage)}`;
  }, [tVars, shareMessage, scoreLabel]);

  const redditTitle = useMemo(() => tVars('pourShareRedditTitle', { score: scoreLabel }), [tVars, scoreLabel]);

  const socialLinks = useMemo(() => {
    if (!webUrl || !shareMessage) return null;
    return {
      whatsapp: `https://wa.me/?text=${encodeURIComponent(shareMessage)}`,
      telegram: `https://t.me/share/url?url=${encodeURIComponent(webUrl)}&text=${encodeURIComponent(telegramBlurb)}`,
      x: `https://twitter.com/intent/tweet?text=${encodeURIComponent(tweetText)}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(webUrl)}`,
      reddit: `https://www.reddit.com/submit?url=${encodeURIComponent(webUrl)}&title=${encodeURIComponent(redditTitle)}`,
    };
  }, [webUrl, shareMessage, telegramBlurb, tweetText, redditTitle]);

  const openUrl = useCallback(async (href: string) => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const ok = await Linking.canOpenURL(href);
    if (ok) void Linking.openURL(href);
  }, []);

  const onNativeShare = useCallback(async () => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      await Share.share({ message: shareMessage, url: webUrl });
    } catch {
      /* dismissed */
    }
  }, [shareMessage, webUrl]);

  const onCopyText = useCallback(async () => {
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    await Clipboard.setStringAsync(shareMessage);
    setCopied('text');
  }, [shareMessage]);

  const onCopyLink = useCallback(async () => {
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    await Clipboard.setStringAsync(webUrl);
    setCopied('link');
  }, [webUrl]);

  const onMaps = useCallback(async () => {
    if (!googlePlaceId) return;
    const url = `https://www.google.com/maps/search/?api=1&query_place_id=${encodeURIComponent(googlePlaceId)}`;
    void openUrl(url);
  }, [googlePlaceId, openUrl]);

  const onBmc = useCallback(() => {
    void openUrl(BMC_URL);
  }, [openUrl]);

  return (
    <View style={styles.panel}>
      <View style={styles.panelHeader}>
        <Text style={styles.panelTitle}>{t('pourSharePanelTitle')}</Text>
        <Muted style={styles.panelBlurb}>{t('pourSharePanelBlurb')}</Muted>
      </View>

      <View style={styles.previewCard}>
        {previewImageUrl ? (
          <Image source={{ uri: previewImageUrl }} style={styles.previewThumb} contentFit="cover" />
        ) : null}
        <View style={styles.previewBody}>
          <Image source={logoAsset} style={styles.previewLogo} contentFit="contain" />
          <Text style={styles.previewHook}>{hook}</Text>
          <View style={styles.previewScoreRow}>
            <Text style={styles.previewScore}>
              {scoreLabel}
              <Text style={styles.previewOutOf}>{t('pourShareOutOfFive')}</Text>
            </Text>
          </View>
          <Text style={styles.previewRanks}>
            {rankAllTimeLine}
            <Text style={styles.rankSep}> | </Text>
            {rankWeekLine}
          </Text>
          <Text style={styles.previewUrl} numberOfLines={2}>
            {webUrl}
          </Text>
        </View>
      </View>

      {socialLinks ? (
        <View style={styles.gridWrap}>
          <View style={styles.grid}>
            <SocialTile
              icon="whatsapp"
              label="WhatsApp"
              onPress={() => void openUrl(socialLinks.whatsapp)}
            />
            <SocialTile
              icon="send"
              label="Telegram"
              onPress={() => void openUrl(socialLinks.telegram)}
            />
            <SocialTile icon="twitter" label="X" onPress={() => void openUrl(socialLinks.x)} />
            <SocialTile
              icon="facebook"
              label="Facebook"
              onPress={() => void openUrl(socialLinks.facebook)}
            />
            <SocialTile icon="reddit" label="Reddit" onPress={() => void openUrl(socialLinks.reddit)} />
            <SocialTile icon="email-outline" label={t('pourShareEmail')} onPress={() => void openUrl(mailtoHref)} />
            <SocialTile
              icon="content-copy"
              label={copied === 'text' ? t('pourShareCopied') : t('pourShareCopyText')}
              onPress={() => void onCopyText()}
            />
            <SocialTile
              icon="link-variant"
              label={copied === 'link' ? t('pourShareCopied') : t('pourShareCopyLink')}
              onPress={() => void onCopyLink()}
            />
          </View>
        </View>
      ) : null}

      <Pressable
        onPress={() => void onNativeShare()}
        style={({ pressed }) => [styles.deviceShare, pressed && styles.deviceSharePressed]}
        accessibilityRole="button"
        accessibilityLabel={t('pourShareViaDevice')}>
        <MaterialCommunityIcons name="share-variant" size={20} color={brandColors.gold} />
        <Text style={styles.deviceShareLabel}>{t('pourShareViaDevice')}</Text>
      </Pressable>

      {pubPageBarKey ? (
        <AppButton
          label={t('pourViewPub')}
          variant="secondary"
          onPress={() => router.push(`/pub/${encodeURIComponent(pubPageBarKey)}`)}
        />
      ) : null}
      {googlePlaceId ? (
        <AppButton label={t('pourOpenInMaps')} variant="secondary" onPress={() => void onMaps()} />
      ) : null}

      <View style={styles.ctaRow}>
        <Pressable
          onPress={() => {
            void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            router.push('/');
          }}
          style={({ pressed }) => [styles.ctaGold, pressed && styles.ctaGoldPressed]}
          accessibilityRole="button"
          accessibilityLabel={t('pourTryAgain')}>
          <Text style={styles.ctaGoldLabel}>{t('pourTryAgain')}</Text>
        </Pressable>
        <Pressable
          onPress={() => {
            void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            router.push('/leaderboard');
          }}
          style={({ pressed }) => [styles.ctaGold, pressed && styles.ctaGoldPressed]}
          accessibilityRole="button"
          accessibilityLabel={t('pourViewTopSplits')}>
          <Text style={styles.ctaGoldLabel}>{t('pourViewTopSplits')}</Text>
        </Pressable>
      </View>

      <Muted style={styles.instaHint}>{t('pourShareSocialBlurb')}</Muted>

      <View style={styles.footer}>
        <Body style={styles.enjoying}>{t('pourEnjoyingApp')}</Body>
        <Pressable onPress={() => void onBmc()} accessibilityRole="link">
          <Text style={styles.bmcLink}>
            {t('pourBuyCreatorBeer')} <MaterialCommunityIcons name="beer-outline" size={16} color={brandColors.gold} />
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

function SocialTile({
  icon,
  label,
  onPress,
}: {
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.tile, pressed && styles.tilePressed]}
      accessibilityRole="button"
      accessibilityLabel={label}>
      <MaterialCommunityIcons name={icon} size={24} color={brandColors.gold} />
      <Text style={styles.tileLabel}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  panel: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(179, 139, 45, 0.12)',
    backgroundColor: 'rgba(29, 24, 15, 0.2)',
    paddingHorizontal: 18,
    paddingVertical: 20,
    gap: 16,
  },
  panelHeader: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: stroke,
    paddingBottom: 12,
  },
  panelTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: brandColors.gold,
    letterSpacing: -0.2,
  },
  panelBlurb: {
    marginTop: 8,
    fontSize: 13,
    lineHeight: 19,
    color: 'rgba(212, 183, 143, 0.68)',
  },
  previewCard: {
    flexDirection: 'row',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#201B10',
    backgroundColor: 'rgba(11, 11, 11, 0.3)',
    overflow: 'hidden',
  },
  previewThumb: {
    width: 88,
    minHeight: 120,
  },
  previewBody: {
    flex: 1,
    paddingHorizontal: 14,
    paddingVertical: 14,
    gap: 6,
  },
  previewLogo: {
    width: 120,
    height: 22,
    opacity: 0.9,
  },
  previewHook: {
    fontSize: 14,
    fontWeight: '600',
    color: brandColors.cream,
    lineHeight: 20,
    marginTop: 4,
  },
  previewScoreRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'baseline',
    gap: 8,
    marginTop: 4,
  },
  previewScore: {
    fontSize: 26,
    fontWeight: '800',
    color: brandColors.gold,
    fontVariant: ['tabular-nums'],
  },
  previewOutOf: {
    fontSize: 15,
    fontWeight: '600',
    color: 'rgba(212, 183, 143, 0.62)',
  },
  previewRanks: {
    fontSize: 12,
    color: 'rgba(253, 251, 243, 0.72)',
    marginTop: 2,
  },
  rankSep: {
    color: 'rgba(179, 139, 45, 0.28)',
  },
  previewUrl: {
    fontSize: 10,
    fontFamily: 'monospace',
    color: 'rgba(212, 183, 143, 0.42)',
    marginTop: 4,
  },
  gridWrap: {
    borderRadius: 12,
    backgroundColor: 'rgba(11, 11, 11, 0.15)',
    padding: 8,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'space-between',
  },
  tile: {
    width: '48%',
    maxWidth: '48%',
    flexGrow: 1,
    flexBasis: '47%',
    minHeight: 76,
    borderRadius: 12,
    backgroundColor: 'rgba(11, 11, 11, 0.45)',
    borderWidth: 1,
    borderColor: 'rgba(179, 139, 45, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 6,
  },
  tilePressed: {
    backgroundColor: 'rgba(179, 139, 45, 0.12)',
    borderColor: 'rgba(179, 139, 45, 0.28)',
  },
  tileLabel: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    color: brandColors.cream,
    textAlign: 'center',
  },
  deviceShare: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    minHeight: 48,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(179, 139, 45, 0.28)',
    backgroundColor: 'rgba(179, 139, 45, 0.1)',
  },
  deviceSharePressed: {
    backgroundColor: 'rgba(179, 139, 45, 0.16)',
  },
  deviceShareLabel: {
    fontSize: 14,
    fontWeight: '800',
    color: brandColors.gold,
  },
  ctaRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
  },
  ctaGold: {
    flex: 1,
    minHeight: 50,
    borderRadius: 12,
    backgroundColor: brandColors.gold,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  ctaGoldPressed: {
    opacity: 0.9,
  },
  ctaGoldLabel: {
    fontSize: 14,
    fontWeight: '800',
    color: brandColors.black,
    textAlign: 'center',
  },
  instaHint: {
    textAlign: 'center',
    fontSize: 12,
    lineHeight: 17,
    color: 'rgba(212, 183, 143, 0.48)',
    marginTop: 2,
  },
  footer: {
    alignItems: 'center',
    gap: 6,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(179, 139, 45, 0.12)',
    paddingTop: 14,
    marginTop: 4,
  },
  enjoying: {
    fontSize: 13,
    color: 'rgba(212, 183, 143, 0.55)',
    textAlign: 'center',
  },
  bmcLink: {
    fontSize: 15,
    fontWeight: '700',
    color: brandColors.gold,
    textAlign: 'center',
  },
});
