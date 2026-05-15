import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Body, Muted } from '@/components/split-the-g/typography';
import { brandColors } from '@/constants/theme';
import { formatLocaleBadge, localeFlagEmoji, localeLanguageTag } from '@/lib/i18n/locale-display';
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
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        <View style={styles.intro}>
          <View style={styles.introBadge}>
            <Ionicons name="language" size={22} color={brandColors.goldBright} />
          </View>
          <Muted style={styles.subtitle}>{t('languageSubtitle')}</Muted>
          <View style={styles.currentRow}>
            <Muted style={styles.currentLabel}>{formatLocaleBadge(locale)}</Muted>
            <Text style={styles.currentHint} numberOfLines={1}>
              {localeLabels[locale]}
            </Text>
          </View>
        </View>

        <View style={styles.list} accessibilityRole="list">
          {supportedLocales.map((code) => {
            const selected = locale === code;
            return (
              <Pressable
                key={code}
                accessibilityRole="button"
                accessibilityState={{ selected }}
                accessibilityLabel={`${localeLabels[code]}, ${localeLanguageTag(code)}`}
                onPress={() => pick(code)}
                style={({ pressed }) => [
                  styles.row,
                  selected && styles.rowSelected,
                  pressed && styles.rowPressed,
                ]}>
                <View style={[styles.flagTile, selected && styles.flagTileSelected]}>
                  <Text style={styles.flagEmoji} allowFontScaling={false}>
                    {localeFlagEmoji(code)}
                  </Text>
                </View>
                <View style={styles.rowMain}>
                  <Body style={[styles.rowTitle, selected && styles.rowTitleSelected]} numberOfLines={1}>
                    {localeLabels[code]}
                  </Body>
                  <Muted style={styles.rowCode}>{localeLanguageTag(code)}</Muted>
                </View>
                <View style={styles.rowTrailing}>
                  {selected ? (
                    <Ionicons name="checkmark-circle" size={26} color={brandColors.goldBright} />
                  ) : (
                    <View style={styles.radioOuter}>
                      <View style={styles.radioInner} />
                    </View>
                  )}
                </View>
              </Pressable>
            );
          })}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: brandColors.black,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 28,
  },
  intro: {
    marginBottom: 22,
    gap: 10,
  },
  introBadge: {
    alignSelf: 'flex-start',
    width: 44,
    height: 44,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: brandColors.border,
    backgroundColor: 'rgba(29, 24, 15, 0.65)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 15,
    lineHeight: 22,
    opacity: 0.92,
  },
  currentRow: {
    marginTop: 6,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 14,
    backgroundColor: 'rgba(197, 160, 89, 0.08)',
    borderWidth: 1,
    borderColor: brandColors.borderSubtle,
    gap: 4,
  },
  currentLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: brandColors.goldBright,
    letterSpacing: 0.4,
  },
  currentHint: {
    fontSize: 15,
    fontWeight: '600',
    color: brandColors.cream,
  },
  list: {
    gap: 10,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: brandColors.borderSubtle,
    backgroundColor: 'rgba(29, 24, 15, 0.62)',
    paddingVertical: 14,
    paddingHorizontal: 14,
    gap: 14,
  },
  rowSelected: {
    borderColor: brandColors.gold,
    backgroundColor: 'rgba(197, 160, 89, 0.14)',
    borderWidth: 1.5,
  },
  rowPressed: {
    opacity: 0.9,
  },
  flagTile: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: 'rgba(11, 11, 11, 0.85)',
    borderWidth: 1,
    borderColor: brandColors.frame,
    alignItems: 'center',
    justifyContent: 'center',
  },
  flagTileSelected: {
    borderColor: brandColors.gold,
    backgroundColor: 'rgba(29, 24, 15, 0.95)',
  },
  flagEmoji: {
    fontSize: 28,
    lineHeight: 32,
  },
  rowMain: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  rowTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: brandColors.cream,
  },
  rowTitleSelected: {
    color: brandColors.goldBright,
  },
  rowCode: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1.1,
    opacity: 0.75,
    textTransform: 'uppercase',
  },
  rowTrailing: {
    width: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioOuter: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: 'rgba(212, 183, 143, 0.45)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: 'transparent',
  },
});
