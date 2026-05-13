import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Body, Muted } from '@/components/split-the-g/typography';
import { brandColors } from '@/constants/theme';
import { useLocale } from '@/lib/i18n/locale-context';
import { supportedLocales, type SupportedLocale } from '@/lib/i18n/translations';

const localeLabels: Record<SupportedLocale, string> = {
  en: 'English',
  th: 'ไทย',
  fr: 'Français',
  es: 'Español',
  de: 'Deutsch',
  it: 'Italiano',
  ja: '日本語',
};

export default function LanguageScreen() {
  const router = useRouter();
  const { t, locale, setLocale } = useLocale();

  async function pick(next: SupportedLocale) {
    await setLocale(next);
    router.back();
  }

  return (
    <SafeAreaView style={styles.safe} edges={['bottom', 'left', 'right']}>
      <View style={styles.inner}>
        <Muted adjustsFontSizeToFit>{t('languageSubtitle')}</Muted>
        <View style={styles.list}>
          {supportedLocales.map((code) => (
            <Pressable
              key={code}
              onPress={() => pick(code)}
              style={({ pressed }) => [styles.row, pressed && styles.pressed]}>
              <Body style={styles.rowLabel}>
                {localeLabels[code]}
                {locale === code ? ' · ✓' : ''}
              </Body>
            </Pressable>
          ))}
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: brandColors.black,
  },
  inner: {
    flex: 1,
    padding: 20,
    gap: 14,
  },
  list: {
    gap: 8,
    marginTop: 8,
  },
  row: {
    borderWidth: 1,
    borderColor: brandColors.frame,
    borderRadius: 12,
    backgroundColor: 'rgba(29, 24, 15, 0.4)',
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  rowLabel: {
    fontSize: 17,
  },
  pressed: {
    opacity: 0.88,
  },
});
