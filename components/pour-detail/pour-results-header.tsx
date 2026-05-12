import { Image, StyleSheet, View } from 'react-native';

import { Tagline } from '@/components/split-the-g/typography';
import { brandColors } from '@/constants/theme';
import { useLocale } from '@/lib/i18n/locale-context';

const logoAsset = require('../../assets/images/logo-splittheg.png');

export function PourResultsHeader() {
  const { t } = useLocale();

  return (
    <View style={styles.wrap}>
      <Image
        source={logoAsset}
        style={styles.logo}
        resizeMode="contain"
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
    gap: 10,
    paddingTop: 4,
    paddingBottom: 4,
  },
  logo: {
    width: 200,
    height: 40,
    opacity: 0.95,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    letterSpacing: -0.4,
    color: brandColors.gold,
    textAlign: 'center',
  },
});
