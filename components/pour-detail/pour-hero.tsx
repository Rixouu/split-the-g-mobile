import { StyleSheet, View } from 'react-native';

import { Body, Muted, Title } from '@/components/split-the-g/typography';
import { brandColors } from '@/constants/theme';
import { useLocale } from '@/lib/i18n/locale-context';
import { getPourCelebrationLine } from '@/lib/i18n/translations';
import { formatSplitScore } from '@/lib/pour/format-split-score';

interface PourHeroProps {
  username: string | null | undefined;
  splitScore: number | null | undefined;
}

export function PourHero({ username, splitScore }: PourHeroProps) {
  const { t, locale } = useLocale();
  const name = username?.trim() || t('pourAnonymousDisplay');
  const n = typeof splitScore === 'number' && Number.isFinite(splitScore) ? splitScore : 0;
  const celebration =
    Number.isFinite(n) && splitScore != null ? getPourCelebrationLine(locale, n) : '';

  return (
    <View style={styles.wrap}>
      <Body style={styles.name}>{name}</Body>
      <Title style={styles.score}>{formatSplitScore(splitScore ?? null)}</Title>
      {celebration ? <Muted style={styles.celebration}>{celebration}</Muted> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: 8,
    paddingTop: 8,
  },
  name: {
    fontSize: 18,
    fontWeight: '700',
    color: brandColors.cream,
  },
  score: {
    fontSize: 52,
    lineHeight: 58,
    letterSpacing: -1,
  },
  celebration: {
    fontSize: 15,
    lineHeight: 22,
  },
});
