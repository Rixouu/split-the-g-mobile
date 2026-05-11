import { StyleSheet, View } from 'react-native';

import { Body, Muted } from '@/components/split-the-g/typography';
import { brandColors } from '@/constants/theme';
import type { PourRankContext } from '@/lib/api/types';
import { useLocale } from '@/lib/i18n/locale-context';

interface PourRankStripProps {
  rank: PourRankContext;
}

export function PourRankStrip({ rank }: PourRankStripProps) {
  const { t } = useLocale();

  return (
    <View style={styles.row}>
      <View style={styles.chip}>
        <Muted style={styles.label}>{t('pourRankAllTime')}</Muted>
        <Body style={styles.value}>#{rank.allTimeRank}</Body>
        <Muted style={styles.sub}>
          {t('pourRankSplitsRecorded')}: {rank.totalSplits}
        </Muted>
      </View>
      <View style={styles.chip}>
        <Muted style={styles.label}>{t('pourRankThisWeek')}</Muted>
        <Body style={styles.value}>#{rank.weeklyRank}</Body>
        <Muted style={styles.sub}>
          {t('pourRankSplitsThisWeek')}: {rank.weeklyTotalSplits}
        </Muted>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: 10,
  },
  chip: {
    flex: 1,
    borderWidth: 1,
    borderColor: brandColors.border,
    borderRadius: 14,
    padding: 12,
    backgroundColor: 'rgba(29, 24, 15, 0.55)',
    gap: 4,
  },
  label: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  value: {
    fontSize: 22,
    fontWeight: '800',
    color: brandColors.goldBright,
  },
  sub: {
    fontSize: 12,
  },
});
