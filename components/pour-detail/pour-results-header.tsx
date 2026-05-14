import { Image } from 'expo-image';
import { StyleSheet, View } from 'react-native';

import { Eyebrow, Tagline } from '@/components/split-the-g/typography';
import { brandColors } from '@/constants/theme';
import { useLocale } from '@/lib/i18n/locale-context';

const logoAsset = require('../../assets/images/logo-splittheg.png');

export function PourResultsHeader() {
  const { t } = useLocale();

  return (
    <View style={styles.wrap}>
      <Eyebrow style={styles.eyebrow}>{t('pourResultsEyebrow')}</Eyebrow>
      <Image
        source={logoAsset}
        style={styles.logo}
        contentFit="contain"
        accessibilityRole="image"
        accessibilityLabel={t('appName')}
      />
      <Tagline style={styles.title}>{t('pourResultsTitle')}</Tagline>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    gap: 6,
    paddingTop: 2,
    paddingBottom: 6,
    marginBottom: 2,
  },
  eyebrow: {
    color: brandColors.goldBright,
    opacity: 0.82,
    letterSpacing: 1.5,
  },
  logo: {
    width: 168,
    height: 34,
    opacity: 0.95,
    marginVertical: 2,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.35,
    color: brandColors.goldBright,
    textAlign: 'center',
    marginTop: 2,
  },
});
