import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { CompetitionFormInset } from '@/components/competition/competition-form-layout';
import { Body, Muted } from '@/components/split-the-g/typography';
import { brandColors } from '@/constants/theme';
import type { PourScore } from '@/lib/api/types';
import { useLocale } from '@/lib/i18n/locale-context';
import { formatSplitScore } from '@/lib/pour/format-split-score';

interface PourScoreSummaryProps {
  score: PourScore;
  pubPageBarKey: string | null;
  onPressPub?: (barKey: string) => void;
}

export function PourScoreSummary({ score, pubPageBarKey, onPressPub }: PourScoreSummaryProps) {
  const { t } = useLocale();
  const scoreStr = formatSplitScore(score.split_score ?? null);
  const geoLine = [score.city, score.region, score.country].filter(Boolean).join(', ');
  const barName = score.bar_name?.trim() ?? '';
  const barAddress = score.bar_address?.trim() ?? '';
  const canOpenPub = Boolean(pubPageBarKey && onPressPub);

  const locationRow = (
    <View style={styles.locationRow}>
      <View style={styles.locationIconWrap}>
        <MaterialCommunityIcons name={barName ? 'glass-mug-variant' : geoLine ? 'map-marker-radius' : 'map-marker-off-outline'} size={22} color="rgba(197, 160, 89, 0.82)" />
      </View>
      <View style={styles.locationCopy}>
        <Text style={styles.locationEyebrow}>{barName ? t('pourVenueLabel') : t('pourLocationLabel')}</Text>
        {barName ? <Body style={canOpenPub ? styles.pubTitleLink : styles.pubTitlePlain}>{barName}</Body> : geoLine ? <Body style={styles.geoPrimary}>{geoLine}</Body> : <Muted>{t('pourNoVenueSaved')}</Muted>}
        {barAddress ? <Muted style={styles.address}>{barAddress}</Muted> : null}
        {canOpenPub ? <Muted style={styles.tapHint}>{t('pourPourSpotHint')}</Muted> : null}
      </View>
      {canOpenPub ? <Ionicons name="chevron-forward" size={18} color="rgba(197, 160, 89, 0.38)" /> : null}
    </View>
  );

  return (
    <CompetitionFormInset>
      <View style={styles.inner}>
        <Text style={styles.analysisTitle}>{t('pourResultsEyebrow')}</Text>
        <Text style={styles.scoreBig}>{scoreStr}</Text>
        <Muted style={styles.outOf}>{t('pourOutOfFive')}</Muted>
        <View style={styles.explanation}>
          <Ionicons name="scan-outline" size={20} color={brandColors.goldBright} />
          <Muted style={styles.explanationText}>This value measures the visible liquid line against the center of the G mark in the submitted still image. It does not reward or require drinking.</Muted>
        </View>
        <View style={styles.divider} />
        {canOpenPub ? <Pressable accessibilityRole="link" onPress={() => onPressPub!(pubPageBarKey!)} style={({ pressed }) => [styles.locationPressable, pressed && styles.locationPressed]}>{locationRow}</Pressable> : locationRow}
      </View>
    </CompetitionFormInset>
  );
}

const styles = StyleSheet.create({
  inner: { paddingHorizontal: 18, paddingVertical: 20, alignItems: 'stretch' },
  analysisTitle: { textAlign: 'center', color: brandColors.goldBright, fontSize: 13, fontWeight: '800', letterSpacing: 1.2, textTransform: 'uppercase' },
  scoreBig: { marginTop: 10, textAlign: 'center', fontSize: 56, lineHeight: 62, fontWeight: '800', color: brandColors.gold, fontVariant: ['tabular-nums'] },
  outOf: { textAlign: 'center', fontSize: 14 },
  explanation: { marginTop: 18, flexDirection: 'row', alignItems: 'flex-start', gap: 10, padding: 14, borderRadius: 12, borderWidth: StyleSheet.hairlineWidth, borderColor: brandColors.borderSubtle, backgroundColor: 'rgba(11,11,11,0.35)' },
  explanationText: { flex: 1, fontSize: 13, lineHeight: 19 },
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: brandColors.borderSubtle, marginVertical: 18 },
  locationPressable: { borderRadius: 12, padding: 8, margin: -8 },
  locationPressed: { backgroundColor: 'rgba(197,160,89,0.06)' },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  locationIconWrap: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(197,160,89,0.07)' },
  locationCopy: { flex: 1, minWidth: 0, gap: 4 },
  locationEyebrow: { fontSize: 10, fontWeight: '800', letterSpacing: 1.1, textTransform: 'uppercase', color: 'rgba(212,183,143,0.48)' },
  pubTitleLink: { fontSize: 17, fontWeight: '700', color: brandColors.goldBright, textDecorationLine: 'underline' },
  pubTitlePlain: { fontSize: 17, fontWeight: '600' },
  geoPrimary: { fontSize: 17, fontWeight: '600' },
  address: { fontSize: 13, lineHeight: 19 },
  tapHint: { fontSize: 12, fontWeight: '600', color: 'rgba(197,160,89,0.78)' },
});
