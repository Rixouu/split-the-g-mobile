import { Image } from 'expo-image';
import { Link } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { brandColors } from '@/constants/theme';
import type { PourScore } from '@/lib/api/types';
import { useLocale } from '@/lib/i18n/locale-context';
import { formatSplitScore } from '@/lib/pour/format-split-score';
import { flagEmojiFromIso2 } from '@/lib/utils/country-display';

function formatPourWhen(iso: string | null | undefined): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (!Number.isFinite(d.getTime())) return '';
  return d.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function barKeyFromName(name: string | null | undefined): string | null {
  const n = name?.trim();
  if (!n) return null;
  return n.toLowerCase();
}

interface PourGridCardProps {
  score: PourScore;
  /** Pub wall: same venue for every row — hide the venue link row. */
  hideVenueRow?: boolean;
}

export function PourGridCard({ score, hideVenueRow }: PourGridCardProps) {
  const { t } = useLocale();
  const pourRef = score.slug || score.id;
  const uri = score.pint_image_url?.trim() || null;
  const username = score.username?.trim() || t('pourAnonymousDisplay');
  const flag = flagEmojiFromIso2(score.country_code);
  const displayName = flag ? `${flag} ${username}` : username;
  const barName = score.bar_name?.trim() || null;
  const bk = barKeyFromName(barName);

  return (
    <View style={styles.card}>
      <Link href={`/pour/${pourRef}`} asChild>
        <Pressable style={styles.mediaTap} accessibilityRole="button">
          <View style={styles.media}>
            {uri ? (
              <Image source={{ uri }} style={styles.image} contentFit="cover" transition={200} />
            ) : (
              <View style={[styles.image, styles.imageFallback]}>
                <Text style={styles.noImageText}>{t('feedNoImage')}</Text>
              </View>
            )}
            <View style={styles.overlay} pointerEvents="none" />
            <View style={styles.overlayBottom} pointerEvents="none">
              <View style={styles.overlayRow}>
                <View style={styles.meta}>
                  <Text style={styles.username} numberOfLines={1}>
                    {displayName}
                  </Text>
                  <Text style={styles.when}>{formatPourWhen(score.created_at)}</Text>
                  {score.pint_price != null && Number.isFinite(Number(score.pint_price)) ? (
                    <Text style={styles.priceHint}>
                      {Number(score.pint_price).toLocaleString(undefined, {
                        minimumFractionDigits: 0,
                        maximumFractionDigits: 2,
                      })}
                    </Text>
                  ) : null}
                </View>
                <View style={styles.scorePill}>
                  <Text style={styles.scoreText}>{formatSplitScore(score.split_score)}</Text>
                </View>
              </View>
            </View>
          </View>
        </Pressable>
      </Link>
      {!hideVenueRow && barName ? (
        <View style={styles.barRow}>
          {bk ? (
            <Link href={`/pub/${bk}`} asChild>
              <Pressable style={styles.barPress} accessibilityRole="link">
                <Text style={styles.barLink} numberOfLines={1}>
                  {barName}
                </Text>
              </Pressable>
            </Link>
          ) : (
            <Text style={styles.barMuted} numberOfLines={1}>
              {barName}
            </Text>
          )}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: brandColors.pourCardStroke,
    backgroundColor: 'rgba(29, 24, 15, 0.55)',
    overflow: 'hidden',
  },
  mediaTap: {
    width: '100%',
  },
  media: {
    aspectRatio: 3 / 4,
    width: '100%',
    position: 'relative',
  },
  image: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: brandColors.panelMuted,
  },
  imageFallback: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  noImageText: {
    fontSize: 11,
    color: 'rgba(212, 183, 143, 0.45)',
    textAlign: 'center',
    paddingHorizontal: 8,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.08)',
  },
  overlayBottom: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 10,
    paddingTop: 36,
    paddingBottom: 10,
    backgroundColor: 'rgba(0,0,0,0.72)',
  },
  overlayRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: 8,
  },
  meta: {
    flex: 1,
    minWidth: 0,
  },
  username: {
    fontSize: 13,
    fontWeight: '700',
    color: brandColors.cream,
  },
  when: {
    marginTop: 2,
    fontSize: 11,
    color: 'rgba(212, 183, 143, 0.65)',
  },
  priceHint: {
    marginTop: 2,
    fontSize: 10,
    fontVariant: ['tabular-nums'],
    color: 'rgba(212, 183, 143, 0.5)',
  },
  scorePill: {
    flexShrink: 0,
    borderRadius: 8,
    backgroundColor: brandColors.gold,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  scoreText: {
    fontSize: 13,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
    color: brandColors.black,
  },
  barRow: {
    borderTopWidth: 1,
    borderTopColor: brandColors.pourCardStroke,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  barPress: {
    alignSelf: 'flex-start',
  },
  barLink: {
    fontSize: 12,
    fontWeight: '600',
    color: 'rgba(197, 160, 89, 0.88)',
  },
  barMuted: {
    fontSize: 12,
    color: 'rgba(212, 183, 143, 0.5)',
  },
});
