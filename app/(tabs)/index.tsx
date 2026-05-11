import * as ImagePicker from 'expo-image-picker';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useState } from 'react';
import {
  Image as RNImage,
  LayoutAnimation,
  Platform,
  Pressable,
  StyleSheet,
  UIManager,
  View,
} from 'react-native';

import { AppButton } from '@/components/split-the-g/button';
import { Card, Screen } from '@/components/split-the-g/screen';
import { Body, Eyebrow, Muted, Tagline } from '@/components/split-the-g/typography';
import { brandColors } from '@/constants/theme';
import { trackEvent } from '@/lib/analytics/client';
import { useAuth } from '@/lib/auth/auth-context';
import { useLocale } from '@/lib/i18n/locale-context';
import { submitPourImage } from '@/lib/pour/submit-pour';
import { mobilePathFromWebPath } from '@/lib/routing/paths';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const logoAsset = require('../../assets/images/logo-splittheg.png');

export default function HomeScreen() {
  const { accessToken, user, signInWithGoogle, isConfigured } = useAuth();
  const { t } = useLocale();
  const [selectedImageUri, setSelectedImageUri] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [howItWorksOpen, setHowItWorksOpen] = useState(false);

  async function pickImage(source: 'camera' | 'library') {
    setMessage(null);
    const permission =
      source === 'camera'
        ? await ImagePicker.requestCameraPermissionsAsync()
        : await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      setMessage('Camera or media permission is required to score a pour.');
      return;
    }

    const result =
      source === 'camera'
        ? await ImagePicker.launchCameraAsync({
            allowsEditing: false,
            base64: false,
            exif: true,
            quality: 0.86,
          })
        : await ImagePicker.launchImageLibraryAsync({
            allowsEditing: false,
            base64: false,
            exif: true,
            quality: 0.86,
          });

    if (result.canceled) return;
    setSelectedImageUri(result.assets[0]?.uri ?? null);
    trackEvent('mobile_pour_image_selected', { source });
  }

  async function submitSelectedImage() {
    if (!selectedImageUri) return;
    setIsSubmitting(true);
    setMessage('Scoring your pour...');

    try {
      const result = await submitPourImage({
        imageUri: selectedImageUri,
        accessToken,
        actorName:
          user?.user_metadata?.full_name?.toString() ||
          user?.user_metadata?.name?.toString() ||
          user?.email?.split('@')[0],
      });

      if (!result.success) {
        setMessage(result.detail || result.error || 'Could not score this pour.');
        return;
      }

      trackEvent('mobile_pour_submitted', { scoreId: result.scoreId ?? null });
      if (result.redirectTo) router.push(mobilePathFromWebPath(result.redirectTo) as never);
      else if (result.scoreId) router.push(`/pour/${result.scoreId}` as never);
      else setMessage('Pour scored, but no result link was returned.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Could not submit this pour.');
    } finally {
      setIsSubmitting(false);
    }
  }

  function toggleHowItWorks() {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setHowItWorksOpen((o) => !o);
  }

  return (
    <Screen>
      <View style={styles.logoRow}>
        <Image source={logoAsset} style={styles.logo} contentFit="contain" accessibilityLabel="Split The G" />
      </View>
      <View style={styles.accentRule} accessible={false} importantForAccessibility="no" />

      <View style={styles.hero}>
        <Tagline>{t('homeTagline')}</Tagline>
        <Muted>{t('homeSubtitle')}</Muted>
      </View>

      <View style={styles.browseGrid}>
        <Pressable
          onPress={() => router.push('/leaderboard')}
          style={({ pressed }) => [styles.browseBtn, pressed && styles.browsePressed]}
          accessibilityRole="button">
          <Body style={styles.browseLabel}>{t('homeTopSplits')}</Body>
        </Pressable>
        <Pressable
          onPress={() => router.push('/wall')}
          style={({ pressed }) => [styles.browseBtn, pressed && styles.browsePressed]}
          accessibilityRole="button">
          <Body style={styles.browseLabel}>{t('homeWall')}</Body>
        </Pressable>
      </View>

      <View style={styles.howItWorks}>
        <Pressable onPress={toggleHowItWorks} style={styles.howHeader} accessibilityRole="button">
          <Eyebrow>{t('homeHowItWorks')}</Eyebrow>
          <Body style={styles.chevron}>{howItWorksOpen ? '▲' : '▼'}</Body>
        </Pressable>
        {howItWorksOpen ? (
          <View style={styles.steps}>
            <View style={styles.stepRow}>
              <Body style={styles.stepNum}>1</Body>
              <Muted style={styles.stepText}>{t('homeStep1')}</Muted>
            </View>
            <View style={styles.stepRow}>
              <Body style={styles.stepNum}>2</Body>
              <Muted style={styles.stepText}>{t('homeStep2')}</Muted>
            </View>
            <View style={styles.stepRow}>
              <Body style={styles.stepNum}>3</Body>
              <Muted style={styles.stepText}>{t('homeStep3')}</Muted>
            </View>
          </View>
        ) : null}
      </View>

      {!isConfigured ? (
        <Card>
          <Body>Supabase env is not configured yet.</Body>
          <Muted>Add EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY to continue.</Muted>
        </Card>
      ) : null}

      <Card>
        <Eyebrow style={styles.sectionEyebrow}>{t('homeScorePour')}</Eyebrow>
        {selectedImageUri ? (
          <RNImage source={{ uri: selectedImageUri }} style={styles.preview} />
        ) : null}
        <View style={styles.actions}>
          <AppButton label={t('homeStartAnalysis')} onPress={() => pickImage('camera')} />
          <Muted style={styles.hint}>{t('homeStartHint')}</Muted>
          <AppButton
            label={t('library')}
            variant="secondary"
            onPress={() => pickImage('library')}
          />
          <AppButton
            label={isSubmitting ? 'Submitting...' : t('submitPour')}
            disabled={!selectedImageUri || isSubmitting}
            onPress={submitSelectedImage}
          />
        </View>
        {message ? <Muted>{message}</Muted> : null}
      </Card>

      {!user ? (
        <Card>
          <Body>{t('signInPrompt')}</Body>
          <AppButton label={t('signInGoogle')} variant="secondary" onPress={signInWithGoogle} />
        </Card>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  logoRow: {
    alignItems: 'center',
    paddingTop: 8,
  },
  logo: {
    width: '88%',
    maxWidth: 280,
    height: 72,
  },
  accentRule: {
    alignSelf: 'center',
    marginTop: 12,
    height: 2,
    width: '55%',
    maxWidth: 200,
    borderRadius: 1,
    backgroundColor: 'rgba(179, 139, 45, 0.35)',
  },
  hero: {
    gap: 10,
    paddingTop: 8,
  },
  browseGrid: {
    flexDirection: 'row',
    gap: 10,
  },
  browseBtn: {
    flex: 1,
    minHeight: 48,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(179, 139, 45, 0.35)',
    backgroundColor: 'rgba(11, 11, 11, 0.5)',
    paddingHorizontal: 8,
  },
  browsePressed: {
    backgroundColor: 'rgba(179, 139, 45, 0.12)',
  },
  browseLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    color: brandColors.gold,
    textAlign: 'center',
  },
  howItWorks: {
    borderWidth: 1,
    borderColor: brandColors.frame,
    borderRadius: 14,
    backgroundColor: 'rgba(29, 24, 15, 0.25)',
    overflow: 'hidden',
  },
  howHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  chevron: {
    color: brandColors.gold,
    fontSize: 12,
    opacity: 0.85,
  },
  steps: {
    paddingHorizontal: 14,
    paddingBottom: 14,
    gap: 12,
  },
  stepRow: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'flex-start',
  },
  stepNum: {
    width: 22,
    textAlign: 'right',
    color: brandColors.gold,
    fontWeight: '700',
    fontSize: 12,
  },
  stepText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 18,
  },
  sectionEyebrow: {
    textAlign: 'center',
  },
  preview: {
    width: '100%',
    height: 300,
    borderRadius: 12,
    backgroundColor: 'rgba(29, 24, 15, 0.5)',
  },
  actions: {
    gap: 12,
  },
  hint: {
    textAlign: 'center',
    fontSize: 13,
  },
});
