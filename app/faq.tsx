import * as Linking from 'expo-linking';
import { useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { AppButton } from '@/components/split-the-g/button';
import { Card, Screen, UNDER_STACK_HEADER_SAFE_AREA_EDGES } from '@/components/split-the-g/screen';
import { Body, Muted, Title } from '@/components/split-the-g/typography';
import { brandColors } from '@/constants/theme';
import { useLocale } from '@/lib/i18n/locale-context';
import { translate, type SupportedLocale } from '@/lib/i18n/translations';

const BMC_URL = 'https://buymeacoffee.com/rixou';

interface FaqBlock {
  id: string;
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

const FAQ_BLOCKS: FaqBlock[] = [
  { id: '1', questionKey: 'faqQSplitTheG' },
  { id: '2', questionKey: 'faqQWhatAppDoes' },
  { id: '3', questionKey: 'faqQHowScore' },
  { id: '4', questionKey: 'faqQGuinnessOnly' },
  { id: '5', questionKey: 'faqQFree' },
  { id: '6', questionKey: 'faqQGlassTypes' },
  { id: '7', questionKey: 'faqQPhotoTips' },
  { id: '8', questionKey: 'faqQShareScore' },
  { id: '9', questionKey: 'faqQHigherScore' },
  { id: '10', questionKey: 'faqQSupport' },
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

export default function FaqScreen() {
  const { locale, t } = useLocale();
  const [openId, setOpenId] = useState<string | null>('1');

  const toggle = useCallback((id: string) => {
    setOpenId((prev) => (prev === id ? null : id));
  }, []);

  return (
    <Screen edges={UNDER_STACK_HEADER_SAFE_AREA_EDGES}>
      <Title>{t('faqPageTitle')}</Title>
      <Muted>{t('faqPageSubtitle')}</Muted>

      {FAQ_BLOCKS.map((block) => {
        const open = openId === block.id;
        return (
          <Card key={block.id}>
            <Pressable onPress={() => toggle(block.id)} style={styles.qRow} accessibilityRole="button">
              <Body style={styles.question}>{translate(locale, block.questionKey)}</Body>
              <Muted>{open ? '−' : '+'}</Muted>
            </Pressable>
            {open ? <FaqAnswerBody block={block} locale={locale} /> : null}
          </Card>
        );
      })}
    </Screen>
  );
}

const styles = StyleSheet.create({
  qRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
  },
  question: {
    flex: 1,
    fontWeight: '700',
    color: brandColors.gold,
    fontSize: 16,
  },
  answer: {
    marginTop: 12,
    lineHeight: 22,
    color: brandColors.cream,
    fontSize: 16,
  },
  answerBlock: {
    marginTop: 12,
    gap: 14,
  },
  inlineLink: {
    color: brandColors.goldBright,
    textDecorationLine: 'underline',
    fontWeight: '700',
  },
});
