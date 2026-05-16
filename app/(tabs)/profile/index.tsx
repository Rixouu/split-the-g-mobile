import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { HubRow, SignedInProfileHub } from '@/components/profile/signed-in-profile-hub';
import { useProfileHubData } from '@/components/profile/hooks/use-profile-hub-data';
import { AppButton } from '@/components/split-the-g/button';
import { ScreenLoadingBlock } from '@/components/split-the-g/screen-loading';
import { Card, Screen } from '@/components/split-the-g/screen';
import { Body, Eyebrow, Muted, Title } from '@/components/split-the-g/typography';
import { brandColors } from '@/constants/theme';
import { useAuth } from '@/lib/auth/auth-context';
import { formatLocaleBadge } from '@/lib/i18n/locale-display';
import { useLocale } from '@/lib/i18n/locale-context';

const HUB_STROKE = brandColors.hubStroke;

export default function ProfileHubScreen() {
  const router = useRouter();
  const { isConfigured, isLoading, signInWithGoogle, user } = useAuth();
  const { locale, t, tVars } = useLocale();
  const hubQuery = useProfileHubData();

  return (
    <Screen contentContainerStyle={styles.scroll}>
      {!isConfigured ? (
        <Card>
          <Body>{t('errorSupabaseEnvTitle')}</Body>
          <Muted>{t('errorSupabaseEnvBody')}</Muted>
        </Card>
      ) : null}

      {!isLoading && !user ? (
        <View style={styles.guestStack}>
          <Eyebrow>{t('profileGuestEyebrow')}</Eyebrow>
          <View style={styles.guestHero}>
            <Title style={styles.guestTitle}>{t('profileGuestTitle')}</Title>
            <Muted style={styles.guestBlurb}>{t('profileGuestBlurb')}</Muted>
            <AppButton label={t('signInGoogle')} onPress={signInWithGoogle} />
            <Text style={styles.guestFaqLine}>
              <Text style={styles.guestFaqLink} onPress={() => router.push('/faq')}>
                {t('profileNavFaq')}
              </Text>
              <Muted style={styles.guestFaqSuffix}>{t('profileGuestFaqBlurbSuffix')}</Muted>
            </Text>
          </View>
          <View style={styles.guestTeaser}>
            <Muted style={styles.guestTeaserText}>{t('profileGuestTeaser')}</Muted>
          </View>
        </View>
      ) : null}

      {isLoading ? <ScreenLoadingBlock /> : null}

      {user && !user.email?.trim() ? (
        <Card>
          <Body>{t('signInPrompt')}</Body>
        </Card>
      ) : null}

      {user?.email?.trim() ? (
        <>
          {hubQuery.isLoading ? <ScreenLoadingBlock /> : null}
          {hubQuery.isError ? (
            <Card>
              <Body>{t('lbError')}</Body>
              <AppButton label={t('profileHubRetry')} variant="secondary" onPress={() => hubQuery.refetch()} />
            </Card>
          ) : null}
          {hubQuery.data ? (
            <SignedInProfileHub user={user} hub={hubQuery.data} t={t} tVars={tVars} />
          ) : null}
        </>
      ) : null}

      {user?.email?.trim() && hubQuery.data ? (
        <View style={styles.langSection}>
          <Eyebrow style={styles.langSectionEyebrow}>{t('navLang')}</Eyebrow>
          <HubRow
            icon={<Ionicons name="globe-outline" size={20} color={brandColors.gold} />}
            title={t('languageTitle')}
            subtitle={t('languageSubtitle')}
            trailing={
              <Text style={styles.languageCurrent} numberOfLines={1}>
                {formatLocaleBadge(locale)}
              </Text>
            }
            onPress={() => router.push('/language')}
          />
        </View>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  scroll: {
    gap: 22,
  },
  guestStack: {
    gap: 20,
    paddingTop: 8,
  },
  guestHero: {
    borderWidth: 1,
    borderColor: 'rgba(179, 139, 45, 0.25)',
    borderRadius: 16,
    padding: 22,
    backgroundColor: 'rgba(29, 24, 15, 0.5)',
    gap: 14,
  },
  guestTitle: {
    fontSize: 26,
    lineHeight: 32,
    color: brandColors.gold,
  },
  guestBlurb: {
    lineHeight: 22,
  },
  guestFaqLine: {
    marginTop: 4,
    textAlign: 'center',
  },
  guestFaqLink: {
    color: brandColors.gold,
    fontWeight: '700',
    fontSize: 14,
    textDecorationLine: 'underline',
  },
  guestFaqSuffix: {
    fontSize: 13,
  },
  guestTeaser: {
    borderWidth: 1,
    borderColor: 'rgba(179, 139, 45, 0.15)',
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 14,
    backgroundColor: 'rgba(29, 24, 15, 0.25)',
    opacity: 0.85,
  },
  guestTeaserText: {
    textAlign: 'center',
    fontSize: 12,
  },
  langSection: {
    marginTop: 4,
    paddingTop: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: HUB_STROKE,
    gap: 0,
  },
  langSectionEyebrow: {
    marginBottom: 10,
  },
  languageCurrent: {
    fontSize: 14,
    fontWeight: '700',
    color: brandColors.gold,
    maxWidth: 152,
    letterSpacing: 0.3,
  },
});
