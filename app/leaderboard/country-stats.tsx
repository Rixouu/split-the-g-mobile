import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { Card, Screen } from '@/components/split-the-g/screen';
import { Body, Eyebrow, Muted, Title } from '@/components/split-the-g/typography';
import { brandColors } from '@/constants/theme';
import { fetchCountryStats24h, fetchCountryStatsAllTime, type CountryStatRow } from '@/lib/api/leaderboard';
import { useLocale } from '@/lib/i18n/locale-context';

type Segment = 'all' | '24h';

function flagHint(code: string): string {
  const c = code.trim().toUpperCase();
  if (c.length !== 2) return '';
  const A = 0x1f1e6;
  const a = 'A'.charCodeAt(0);
  const chars = [...c].map((ch) => A + (ch.charCodeAt(0) - a));
  try {
    return String.fromCodePoint(...chars);
  } catch {
    return '';
  }
}

function StatRow({ row }: { row: CountryStatRow }) {
  const { t } = useLocale();
  const avg = Number(row.average_score);
  const avgLabel = Number.isFinite(avg) ? avg.toFixed(2) : '—';
  const emoji = row.country_code ? flagHint(row.country_code) : '';
  return (
    <Card>
      <Body style={styles.rowTitle}>
        {emoji ? `${emoji} ` : ''}
        {row.country}
      </Body>
      <Muted>
        {t('lbStatRowMeta').replace('{count}', String(row.submission_count)).replace('{avg}', avgLabel)}
      </Muted>
    </Card>
  );
}

export default function CountryStatsLeaderboardScreen() {
  const { t } = useLocale();
  const [segment, setSegment] = useState<Segment>('all');

  const allTime = useQuery({
    queryKey: ['countryStats', 'all'],
    queryFn: fetchCountryStatsAllTime,
    enabled: segment === 'all',
  });

  const past24 = useQuery({
    queryKey: ['countryStats', '24h'],
    queryFn: fetchCountryStats24h,
    enabled: segment === '24h',
  });

  const active = segment === 'all' ? allTime : past24;
  const rows = active.data ?? [];

  return (
    <Screen>
      <View style={styles.header}>
        <Eyebrow>{t('navLeaderboard')}</Eyebrow>
        <Title>{t('lbCountryStats')}</Title>
        <Muted>{segment === '24h' ? t('lbCountryStatsBlurb24h') : t('lbCountryStatsBlurbAllTime')}</Muted>
      </View>

      <View style={styles.seg}>
        <Pressable
          onPress={() => setSegment('all')}
          style={[styles.segBtn, segment === 'all' && styles.segBtnOn]}
          accessibilityRole="button">
          <Body style={[styles.segLabel, segment === 'all' && styles.segLabelOn]}>{t('lbCountryStatsAllTime')}</Body>
        </Pressable>
        <Pressable
          onPress={() => setSegment('24h')}
          style={[styles.segBtn, segment === '24h' && styles.segBtnOn]}
          accessibilityRole="button">
          <Body style={[styles.segLabel, segment === '24h' && styles.segLabelOn]}>{t('lbCountryStats24h')}</Body>
        </Pressable>
      </View>

      {active.isLoading ? (
        <Card>
          <Body>{t('commonLoading')}</Body>
        </Card>
      ) : null}
      {active.error ? (
        <Card>
          <Body>{t('lbCountryStatsError')}</Body>
          <Muted>{active.error.message}</Muted>
        </Card>
      ) : null}

      {!active.isLoading && rows.length === 0 ? (
        <Card>
          <Muted>{t('lbEmpty')}</Muted>
        </Card>
      ) : null}

      {rows.map((row, i) => (
        <StatRow key={`${row.country_code}-${i}`} row={row} />
      ))}
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    gap: 8,
    paddingTop: 12,
  },
  seg: {
    flexDirection: 'row',
    gap: 8,
  },
  segBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: brandColors.frame,
    alignItems: 'center',
  },
  segBtnOn: {
    borderColor: brandColors.gold,
    backgroundColor: 'rgba(179, 139, 45, 0.12)',
  },
  segLabel: {
    fontWeight: '700',
    color: brandColors.muted,
  },
  segLabelOn: {
    color: brandColors.goldBright,
  },
  rowTitle: {
    fontWeight: '700',
    fontSize: 17,
  },
});
