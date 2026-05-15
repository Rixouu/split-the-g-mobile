import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import * as Linking from 'expo-linking';
import { Stack, useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  LayoutAnimation,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  UIManager,
  View,
} from 'react-native';

import { AppButton } from '@/components/split-the-g/button';
import { Screen, UNDER_STACK_HEADER_SAFE_AREA_EDGES } from '@/components/split-the-g/screen';
import { Body, Eyebrow } from '@/components/split-the-g/typography';
import { brandColors } from '@/constants/theme';
import { useLocale } from '@/lib/i18n/locale-context';
import { translate, type SupportedLocale, type TranslationKey } from '@/lib/i18n/translations';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const BMC_URL = 'https://buymeacoffee.com/rixou';

type FaqSection = 'basics' | 'scoring' | 'more';

const SECTION_ORDER: readonly FaqSection[] = ['basics', 'scoring', 'more'];

const SECTION_TITLE: Record<FaqSection, TranslationKey> = {
  basics: 'faqSectionBasics',
  scoring: 'faqSectionScoring',
  more: 'faqSectionMore',
};

interface FaqBlock {
  id: string;
  section: FaqSection;
  questionKey:
    | 'faqQSplitTheG'
    | 'faqQWhatAppDoes'
    | 'faqQHowScore'
    | 'faqQGuinnessOnly'
    | 'faqQFree'
    | 'faqQGlassTypes'
    | 'faqQPhotoTips'
    | 'faqQShareScore'
    | 'faqQHigherScore'
    | 'faqQSupport';
}

/** Grouped for scanability; ids preserved for stable open state. */
const FAQ_BLOCKS: FaqBlock[] = [
  { id: '1', section: 'basics', questionKey: 'faqQSplitTheG' },
  { id: '2', section: 'basics', questionKey: 'faqQWhatAppDoes' },
  { id: '5', section: 'basics', questionKey: 'faqQFree' },
  { id: '3', section: 'scoring', questionKey: 'faqQHowScore' },
  { id: '4', section: 'scoring', questionKey: 'faqQGuinnessOnly' },
  { id: '6', section: 'scoring', questionKey: 'faqQGlassTypes' },
  { id: '7', section: 'scoring', questionKey: 'faqQPhotoTips' },
  { id: '9', section: 'scoring', questionKey: 'faqQHigherScore' },
  { id: '8', section: 'more', questionKey: 'faqQShareScore' },
  { id: '10', section: 'more', questionKey: 'faqQSupport' },
];

function FaqWhatAppAnswer({ locale }: { locale: SupportedLocale }) {
  const router = useRouter();
  const linkStyle = styles.inlineLink;

  return (
    <Text style={styles.answer}>
      {translate(locale, 'faqAWhatAppDoesIntro')}{' '}
      <Text style={linkStyle} onPress={() => router.push('/feed')}>
        {translate(locale, 'navFeed').toLowerCase()}
      </Text>
      {translate(locale, 'faqAWhatAppDoesMid1')}{' '}
      <Text style={linkStyle} onPress={() => router.push('/pubs')}>
        {translate(locale, 'navPubs').toLowerCase()}
      </Text>
      {translate(locale, 'faqAWhatAppDoesMid2')}{' '}
      <Text style={linkStyle} onPress={() => router.push('/leaderboard')}>
        {translate(locale, 'navLeaderboard').toLowerCase()}
      </Text>
      {translate(locale, 'faqAWhatAppDoesMid3')}{' '}
      <Text style={linkStyle} onPress={() => router.push('/compete')}>
        {translate(locale, 'navCompete').toLowerCase()}
      </Text>
      {translate(locale, 'faqAWhatAppDoesOutro')}
    </Text>
  );
}

function FaqAnswerBody({ block, locale }: { block: FaqBlock; locale: SupportedLocale }) {
  if (block.questionKey === 'faqQWhatAppDoes') {
    return <FaqWhatAppAnswer locale={locale} />;
  }

  if (block.questionKey === 'faqQSupport') {
    return (
      <View style={styles.answerBlock}>
        <Body style={styles.answer}>{translate(locale, 'faqASupport')}</Body>
        <AppButton label={translate(locale, 'pourBuyCreatorBeer')} onPress={() => void Linking.openURL(BMC_URL)} />
      </View>
    );
  }

  const answerKey = {
    faqQSplitTheG: 'faqASplitTheG',
    faqQHowScore: 'faqAHowScore',
    faqQGuinnessOnly: 'faqAGuinnessOnly',
    faqQFree: 'faqAFree',
    faqQGlassTypes: 'faqAGlassTypes',
    faqQPhotoTips: 'faqAPhotoTips',
    faqQShareScore: 'faqAShareScore',
    faqQHigherScore: 'faqAHigherScore',
  }[block.questionKey] as
    | 'faqASplitTheG'
    | 'faqAHowScore'
    | 'faqAGuinnessOnly'
    | 'faqAFree'
    | 'faqAGlassTypes'
    | 'faqAPhotoTips'
    | 'faqAShareScore'
    | 'faqAHigherScore';

  return <Body style={styles.answer}>{translate(locale, answerKey)}</Body>;
}

function FaqAccordionItem({
  block,
  locale,
  open,
  onToggle,
}: {
  block: FaqBlock;
  locale: SupportedLocale;
  open: boolean;
  onToggle: (id: string) => void;
}) {
  return (
    <View style={styles.faqCard}>
      <Pressable
        onPress={() => onToggle(block.id)}
        style={({ pressed }) => [styles.qPressable, pressed && styles.qPressablePressed]}
        accessibilityRole="button"
        accessibilityState={{ expanded: open }}>
        <Body style={styles.question}>{translate(locale, block.questionKey)}</Body>
        <View style={styles.chevronWrap}>
          <Ionicons name="chevron-down" size={20} color={brandColors.goldBright} style={[styles.chevron, open && styles.chevronOpen]} />
        </View>
      </Pressable>
      {open ? (
        <View style={styles.answerInner}>
          <FaqAnswerBody block={block} locale={locale} />
        </View>
      ) : null}
    </View>
  );
}

export default function FaqScreen() {
  const { locale, t } = useLocale();
  const [openId, setOpenId] = useState<string | null>('1');
  const [query, setQuery] = useState('');

  const filteredBlocks = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return FAQ_BLOCKS;
    return FAQ_BLOCKS.filter((b) => translate(locale, b.questionKey).toLowerCase().includes(q));
  }, [locale, query]);

  useEffect(() => {
    const q = query.trim();
    if (!q || filteredBlocks.length !== 1) return;
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setOpenId(filteredBlocks[0].id);
  }, [query, filteredBlocks]);

  useEffect(() => {
    if (openId != null && !filteredBlocks.some((b) => b.id === openId)) {
      setOpenId(null);
    }
  }, [filteredBlocks, openId]);

  const toggle = useCallback((id: string) => {
    void Haptics.selectionAsync();
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setOpenId((prev) => (prev === id ? null : id));
  }, []);

  return (
    <Screen edges={UNDER_STACK_HEADER_SAFE_AREA_EDGES} contentContainerStyle={styles.screenContent} keyboardShouldPersistTaps="handled">
      <Stack.Screen options={{ title: t('profileNavFaq') }} />
      <Body style={styles.intro}>{t('faqPageSubtitle')}</Body>

      <View style={styles.searchRow}>
        <Ionicons name="search" size={20} color={brandColors.tanMuted} style={styles.searchIcon} />
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder={t('faqSearchPlaceholder')}
          placeholderTextColor={brandColors.tanMuted}
          style={styles.searchInput}
          accessibilityLabel={t('faqSearchAccessibilityLabel')}
          autoCorrect={false}
          autoCapitalize="none"
          clearButtonMode="never"
          returnKeyType="search"
        />
        {query.length > 0 ? (
          <Pressable
            onPress={() => setQuery('')}
            hitSlop={12}
            accessibilityRole="button"
            accessibilityLabel={t('faqSearchClear')}
            style={styles.clearBtn}>
            <Ionicons name="close-circle" size={22} color={brandColors.tanMuted} />
          </Pressable>
        ) : null}
      </View>

      {filteredBlocks.length === 0 ? (
        <View style={styles.emptySearch}>
          <Ionicons name="chatbubbles-outline" size={36} color={brandColors.tanMuted} style={styles.emptyIcon} />
          <Body style={styles.emptyText}>{t('faqSearchNoResults')}</Body>
        </View>
      ) : (
        SECTION_ORDER.map((section) => {
          const blocks = filteredBlocks.filter((b) => b.section === section);
          if (blocks.length === 0) return null;
          return (
            <View key={section} style={styles.section}>
              <Eyebrow style={styles.sectionEyebrow}>{t(SECTION_TITLE[section])}</Eyebrow>
              <View style={styles.sectionStack}>
                {blocks.map((block) => (
                  <FaqAccordionItem
                    key={block.id}
                    block={block}
                    locale={locale}
                    open={openId === block.id}
                    onToggle={toggle}
                  />
                ))}
              </View>
            </View>
          );
        })
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  screenContent: {
    gap: 14,
    paddingTop: 8,
  },
  intro: {
    color: brandColors.tanMuted,
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '500',
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: brandColors.border,
    borderRadius: 14,
    backgroundColor: 'rgba(253, 251, 243, 0.04)',
    paddingLeft: 12,
    paddingRight: 6,
    minHeight: 48,
  },
  searchIcon: {
    marginRight: 8,
    opacity: 0.9,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16,
    color: brandColors.cream,
    ...(Platform.OS === 'android' ? { includeFontPadding: false } : {}),
  },
  clearBtn: {
    padding: 6,
  },
  section: {
    gap: 10,
  },
  sectionEyebrow: {
    marginTop: 2,
    marginBottom: -2,
    paddingHorizontal: 2,
  },
  sectionStack: {
    gap: 10,
  },
  emptySearch: {
    alignItems: 'center',
    paddingVertical: 28,
    paddingHorizontal: 16,
    gap: 12,
  },
  emptyIcon: {
    opacity: 0.55,
  },
  emptyText: {
    textAlign: 'center',
    color: brandColors.tanMuted,
    fontSize: 15,
    lineHeight: 22,
  },
  faqCard: {
    borderWidth: 1,
    borderColor: brandColors.borderSubtle,
    borderRadius: 16,
    backgroundColor: 'rgba(253, 251, 243, 0.035)',
    overflow: 'hidden',
  },
  qPressable: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  qPressablePressed: {
    backgroundColor: 'rgba(197, 160, 89, 0.06)',
  },
  question: {
    flex: 1,
    fontWeight: '600',
    color: brandColors.cream,
    fontSize: 16,
    lineHeight: 22,
  },
  chevronWrap: {
    width: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chevron: {
    opacity: 0.88,
  },
  chevronOpen: {
    transform: [{ rotate: '180deg' }],
  },
  answerInner: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    paddingTop: 2,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: brandColors.borderSubtle,
  },
  answer: {
    marginTop: 10,
    lineHeight: 23,
    color: brandColors.cream,
    fontSize: 15,
  },
  answerBlock: {
    marginTop: 10,
    gap: 14,
  },
  inlineLink: {
    color: brandColors.goldBright,
    textDecorationLine: 'underline',
    fontWeight: '700',
  },
});
