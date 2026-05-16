import * as ImagePicker from 'expo-image-picker';
import { Image } from 'expo-image';
import { router, useGlobalSearchParams } from 'expo-router';
import { useCallback, useRef, useState } from 'react';
import {
  Image as RNImage,
  LayoutAnimation,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  UIManager,
  View,
} from 'react-native';

import { LivePourCameraModal } from '@/components/pour/live-pour-camera-modal';
import { AppButton } from '@/components/split-the-g/button';
import { Card, Screen } from '@/components/split-the-g/screen';
import { ScreenLoadingBlock } from '@/components/split-the-g/screen-loading';
import { Body, Eyebrow, Muted, Tagline, Title } from '@/components/split-the-g/typography';
import { brandColors } from '@/constants/theme';
import { trackEvent } from '@/lib/analytics/client';
import { useAuth } from '@/lib/auth/auth-context';
import { useLocale } from '@/lib/i18n/locale-context';
import type { TranslationKey } from '@/lib/i18n/translations';
import { submitPourImage } from '@/lib/pour/submit-pour';
import { mobilePathFromWebPath } from '@/lib/routing/paths';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const logoAsset = require('../../assets/images/logo-splittheg.png');

const COMPETITION_UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function normalizeSearchParam(value: string | string[] | undefined): string {
  if (typeof value === 'string') return value.trim();
  if (Array.isArray(value) && typeof value[0] === 'string') return value[0].trim();
  return '';
}

function messageForPourError(
  t: (key: TranslationKey) => string,
  err?: string,
  detail?: string,
): string {
  if (err === 'PROCESS_FAILED') return t('homeErrFailedProcess');
  if (err === 'ANALYSIS_TIMEOUT') return t('homeErrAnalysisTimeout');
  if (err === 'ROBOFLOW_FAILED') return t('homeErrRoboflow');
  if (err === 'RATE_LIMITED') return t('homeErrRateLimited');
  if (err === 'DUPLICATE_IMAGE') return t('homeErrDuplicate');
  if (err === 'STALE_IMAGE_EXIF') return t('homeErrStaleExif');
  if (err === 'INVALID_IMAGE') return t('homeErrInvalidImage');
  if (typeof detail === 'string' && detail.trim()) return detail.trim();
  return t('homeErrGenericPour');
}

export default function HomeScreen() {
  const { accessToken, user, signInWithGoogle, isConfigured } = useAuth();
  const { t } = useLocale();
  const globalParams = useGlobalSearchParams<{ competition?: string | string[] }>();
  const competitionRaw = normalizeSearchParam(globalParams.competition);
  const competitionId = COMPETITION_UUID_RE.test(competitionRaw) ? competitionRaw : null;

  const [selectedImageUri, setSelectedImageUri] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [howItWorksOpen, setHowItWorksOpen] = useState(false);
  const [showNoGModal, setShowNoGModal] = useState(false);
  const [livePourOpen, setLivePourOpen] = useState(false);
  const lastPickSourceRef = useRef<'camera' | 'library'>('camera');

  const submitPourFromUri = useCallback(
    async (imageUri: string, source: 'camera' | 'library') => {
      setMessage(null);
      setShowNoGModal(false);
      setIsSubmitting(true);

      try {
        const result = await submitPourImage({
          imageUri,
          accessToken,
          actorName:
            user?.user_metadata?.full_name?.toString() ||
            user?.user_metadata?.name?.toString() ||
            user?.email?.split('@')[0],
          competitionId,
        });

        if (!result.success) {
          if (result.error === 'NO_G') {
            setShowNoGModal(true);
            return;
          }
          setMessage(messageForPourError(t, result.error, result.detail));
          trackEvent('mobile_pour_failed', { code: result.error ?? 'unknown', source });
          return;
        }

        trackEvent('mobile_pour_submitted', { scoreId: result.scoreId ?? null, source });
        setSelectedImageUri(null);
        if (result.redirectTo) router.push(mobilePathFromWebPath(result.redirectTo) as never);
        else if (result.scoreId) router.push(`/pour/${result.scoreId}` as never);
        else setMessage(t('homeErrGenericPour'));
      } catch (error) {
        setMessage(error instanceof Error ? error.message : t('homeErrGenericPour'));
      } finally {
        setIsSubmitting(false);
      }
    },
    [accessToken, competitionId, t, user],
  );

  async function pickImage(source: 'camera' | 'library') {
    setMessage(null);
    setShowNoGModal(false);

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
    const uri = result.assets[0]?.uri ?? null;
    if (!uri) return;

    lastPickSourceRef.current = source;
    setSelectedImageUri(uri);
    trackEvent('mobile_pour_image_selected', { source });
    await submitPourFromUri(uri, source);
  }

  function toggleHowItWorks() {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setHowItWorksOpen((o) => !o);
  }

  function clearPourSelection() {
    setSelectedImageUri(null);
    setMessage(null);
    setShowNoGModal(false);
  }

  return (
    <Screen>
      <Modal visible={isSubmitting} transparent animationType="fade" statusBarTranslucent>
        <View style={styles.fullscreenOverlay} accessibilityViewIsModal>
          <ScreenLoadingBlock
            label={t('homeAnalyzingPour')}
            subtitle={t('homeOneMoment')}
            primaryVariant="title"
            dense
            style={styles.overlayLoadingBlock}
          />
        </View>
      </Modal>

      <LivePourCameraModal
        visible={livePourOpen}
        onClose={() => setLivePourOpen(false)}
        onPourFrameCaptured={(uri) => {
          setLivePourOpen(false);
          lastPickSourceRef.current = 'camera';
          setSelectedImageUri(uri);
          void submitPourFromUri(uri, 'camera');
        }}
        t={t}
      />

      <Modal visible={showNoGModal} transparent animationType="fade" statusBarTranslucent>
        <View style={styles.fullscreenOverlay} accessibilityViewIsModal>
          <View style={styles.noGCard}>
            <Title style={styles.noGTitle}>{t('homeNoGTitle')}</Title>
            <Muted style={styles.noGBody}>{t('homeNoGBody')}</Muted>
            <AppButton
              label={t('pourTryAgain')}
              onPress={() => {
                setShowNoGModal(false);
                clearPourSelection();
              }}
            />
          </View>
        </View>
      </Modal>

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
          onPress={() => router.push('/feed?tab=wall')}
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

      {competitionId ? (
        <Card>
          <Muted style={styles.compBanner}>{t('homeCompetitionBanner')}</Muted>
        </Card>
      ) : null}

      <Card>
        <Eyebrow style={styles.sectionEyebrow}>{t('homeScorePour')}</Eyebrow>
        {selectedImageUri ? (
          <RNImage source={{ uri: selectedImageUri }} style={styles.preview} />
        ) : null}
        <View style={styles.actions}>
          <AppButton
            label={t('homeStartAnalysis')}
            disabled={isSubmitting}
            onPress={() => {
              setMessage(null);
              setLivePourOpen(true);
            }}
          />
          <Muted style={styles.hint}>{t('homeStartHint')}</Muted>
          <AppButton
            label={t('homeUploadPhoto')}
            variant="secondary"
            disabled={isSubmitting}
            onPress={() => void pickImage('library')}
          />
          {selectedImageUri && !isSubmitting ? (
            <View style={styles.retryRow}>
              <AppButton
                label={t('pourTryAgain')}
                variant="secondary"
                disabled={!selectedImageUri}
                onPress={() =>
                  void submitPourFromUri(selectedImageUri, lastPickSourceRef.current)
                }
              />
              <AppButton label={t('homeChangePhoto')} variant="secondary" onPress={clearPourSelection} />
            </View>
          ) : null}
        </View>
        {message ? <Muted style={styles.errorText}>{message}</Muted> : null}
      </Card>

      {!user ? (
        <Card>
          <Eyebrow style={styles.sectionEyebrow}>{t('homeSignInEyebrow')}</Eyebrow>
          <Muted style={styles.signInBlurb}>{t('signInPrompt')}</Muted>
          <View style={styles.signInActions}>
            <AppButton label={t('signInGoogle')} fullWidth onPress={signInWithGoogle} />
          </View>
        </Card>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  fullscreenOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.94)',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
    paddingHorizontal: 24,
  },
  overlayLoadingBlock: {
    paddingVertical: 0,
  },
  noGCard: {
    maxWidth: 400,
    width: '100%',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(179, 139, 45, 0.25)',
    backgroundColor: 'rgba(11, 11, 11, 0.92)',
    padding: 24,
    gap: 16,
  },
  noGTitle: {
    textAlign: 'center',
  },
  noGBody: {
    textAlign: 'center',
    fontSize: 14,
    lineHeight: 20,
  },
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
  compBanner: {
    textAlign: 'center',
    fontSize: 13,
    lineHeight: 19,
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
  retryRow: {
    gap: 10,
  },
  errorText: {
    textAlign: 'center',
    fontSize: 13,
  },
  signInBlurb: {
    textAlign: 'center',
    fontSize: 14,
    lineHeight: 21,
    marginTop: 4,
    paddingHorizontal: 4,
  },
  signInActions: {
    marginTop: 6,
    alignSelf: 'stretch',
  },
});
