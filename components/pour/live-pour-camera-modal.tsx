import { CameraView, useCameraPermissions } from 'expo-camera';
import { type ElementRef, useCallback, useEffect, useRef, useState } from 'react';
import {
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  useWindowDimensions,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppButton } from '@/components/split-the-g/button';
import { PintGlassOverlay } from '@/components/split-the-g/pint-glass-overlay';
import { ScreenLoadingBlock } from '@/components/split-the-g/screen-loading';
import { Body, Muted } from '@/components/split-the-g/typography';
import { brandColors } from '@/constants/theme';
import { trackEvent } from '@/lib/analytics/client';
import { hasRoboflowLiveDetectConfig } from '@/lib/config';
import type { TranslationKey } from '@/lib/i18n/translations';
import {
  predictionsHaveGlassAndG,
  runRoboflowHostedDetect,
} from '@/lib/roboflow/hosted-detect';

const DETECT_INTERVAL_MS = 500;
const STREAK_FRAMES = 4;

interface LivePourCameraModalProps {
  visible: boolean;
  onClose: () => void;
  /** High-res frame to send to `/api/pour-submission` (same as web after auto-capture). */
  onPourFrameCaptured: (localImageUri: string) => void;
  t: (key: TranslationKey) => string;
}

export function LivePourCameraModal({
  visible,
  onClose,
  onPourFrameCaptured,
  t,
}: LivePourCameraModalProps) {
  const { height: windowHeight, width: windowWidth } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<ElementRef<typeof CameraView>>(null);

  const [cameraReady, setCameraReady] = useState(false);
  const [feedbackKey, setFeedbackKey] = useState<TranslationKey>('homeFeedbackShowGlass');
  const [isInferenceUnavailable, setIsInferenceUnavailable] = useState(false);
  const [torchOn, setTorchOn] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);

  const inferBusyRef = useRef(false);
  const cancelledRef = useRef(false);
  const streakRef = useRef(0);
  const finishedRef = useRef(false);

  const canRunHostedDetect = hasRoboflowLiveDetectConfig() && !isInferenceUnavailable;

  useEffect(() => {
    if (!visible) return;
    cancelledRef.current = false;
    finishedRef.current = false;
    setCameraReady(false);
    setIsInferenceUnavailable(false);
    setTorchOn(false);
    setIsCapturing(false);
    streakRef.current = 0;
    setFeedbackKey('homeFeedbackShowGlass');
    return () => {
      cancelledRef.current = true;
    };
  }, [visible]);

  useEffect(() => {
    if (!visible) return;
    if (!permission?.granted) void requestPermission();
  }, [visible, permission?.granted, requestPermission]);

  const captureHighResAndFinish = useCallback(async () => {
    const cam = cameraRef.current;
    if (!cam || cancelledRef.current || finishedRef.current) return;
    finishedRef.current = true;
    setIsCapturing(true);
    try {
      const shot = await cam.takePictureAsync({
        quality: 0.92,
        base64: false,
        exif: true,
        shutterSound: false,
        imageType: 'jpg',
      });
      if (cancelledRef.current || !shot?.uri) {
        finishedRef.current = false;
        return;
      }
      trackEvent('mobile_live_pour_auto_captured', {});
      onPourFrameCaptured(shot.uri);
    } catch {
      finishedRef.current = false;
    } finally {
      if (!cancelledRef.current) setIsCapturing(false);
    }
  }, [onPourFrameCaptured]);

  const runDetectionTick = useCallback(async () => {
    if (finishedRef.current || cancelledRef.current || inferBusyRef.current || isCapturing) return;
    const cam = cameraRef.current;
    if (!cam || !cameraReady) return;

    inferBusyRef.current = true;
    try {
      const pic = await cam.takePictureAsync({
        base64: true,
        quality: 0.38,
        shutterSound: false,
        imageType: 'jpg',
      });
      const raw = pic.base64?.replace(/^data:image\/\w+;base64,/, '') ?? '';
      if (!raw) return;

      const predictions = await runRoboflowHostedDetect(raw);
      const { hasGlass, hasG } = predictionsHaveGlassAndG(predictions);

      if (hasGlass && hasG) {
        const next = streakRef.current + 1;
        streakRef.current = next;
        if (next >= STREAK_FRAMES) {
          setFeedbackKey('homeFeedbackPerfect');
          await captureHighResAndFinish();
          return;
        }
        if (next >= 2) setFeedbackKey('homeFeedbackHoldStill');
        else setFeedbackKey('homeFeedbackCentered');
      } else {
        streakRef.current = 0;
        if (!hasGlass) setFeedbackKey('homeFeedbackShowGlass');
        else setFeedbackKey('homeFeedbackGVisible');
      }
    } catch {
      setIsInferenceUnavailable(true);
      setFeedbackKey('homeInferenceUnavailable');
      streakRef.current = 0;
    } finally {
      inferBusyRef.current = false;
    }
  }, [cameraReady, captureHighResAndFinish, isCapturing]);

  useEffect(() => {
    if (!visible || !cameraReady || !canRunHostedDetect) return;
    const id = setInterval(() => {
      void runDetectionTick();
    }, DETECT_INTERVAL_MS);
    return () => clearInterval(id);
  }, [visible, cameraReady, canRunHostedDetect, runDetectionTick]);

  async function manualCapture() {
    const cam = cameraRef.current;
    if (!cam) return;
    finishedRef.current = true;
    setIsCapturing(true);
    try {
      const shot = await cam.takePictureAsync({
        quality: 0.92,
        base64: false,
        exif: true,
        shutterSound: false,
        imageType: 'jpg',
      });
      if (shot?.uri) {
        trackEvent('mobile_live_pour_manual_captured', {});
        onPourFrameCaptured(shot.uri);
      } else {
        finishedRef.current = false;
      }
    } finally {
      setIsCapturing(false);
    }
  }

  if (!visible) return null;

  const guideMaxHeight = Math.min(windowHeight * 0.52, 320);
  let guideHeight = guideMaxHeight;
  let guideWidth = guideHeight * (400 / 600);
  const guideMaxWidth = Math.max(0, windowWidth - 48);
  if (guideWidth > guideMaxWidth) {
    guideWidth = guideMaxWidth;
    guideHeight = guideWidth * (600 / 400);
  }

  return (
    <Modal visible={visible} animationType="slide" statusBarTranslucent onRequestClose={onClose}>
      <View style={[styles.root, { paddingTop: insets.top + 8 }]}>
        <View style={styles.topBar}>
          <Pressable onPress={onClose} style={styles.closeHit} accessibilityRole="button">
            <Body style={styles.closeText}>{t('homeCloseLiveCamera')}</Body>
          </Pressable>
          <Pressable
            onPress={() => setTorchOn((v) => !v)}
            style={styles.closeHit}
            accessibilityRole="button">
            <Body style={styles.closeText}>{torchOn ? t('homeTorchOff') : t('homeTorchOn')}</Body>
          </Pressable>
        </View>

        {!permission?.granted ? (
          <View style={styles.centerBlock}>
            <Muted style={styles.centered}>{t('homeCameraPermission')}</Muted>
            <AppButton
              label={t('homeRequestCameraPermission')}
              variant="secondary"
              onPress={() => void requestPermission()}
            />
            <AppButton label={t('homeCloseLiveCamera')} variant="secondary" onPress={onClose} />
          </View>
        ) : (
          <>
            <View style={styles.cameraOuter}>
              <View style={styles.cameraWrap}>
                <CameraView
                  ref={cameraRef}
                  style={StyleSheet.absoluteFill}
                  facing="back"
                  mode="picture"
                  {...(Platform.OS === 'android' ? { ratio: '4:3' as const } : {})}
                  enableTorch={torchOn}
                  onCameraReady={() => setCameraReady(true)}
                  onMountError={() => {
                    setIsInferenceUnavailable(true);
                    setFeedbackKey('homeInferenceUnavailable');
                  }}
                />
                <View
                  style={styles.guideLayer}
                  pointerEvents="none"
                  accessibilityElementsHidden
                  importantForAccessibility="no-hide-descendants">
                  <View style={styles.glassShift}>
                    <PintGlassOverlay width={guideWidth} height={guideHeight} />
                  </View>
                </View>
                {isCapturing ? (
                  <View style={styles.capturingOverlay}>
                    <ScreenLoadingBlock showCaption={false} dense style={styles.capturingSpinner} />
                  </View>
                ) : null}
              </View>
            </View>

            <View style={[styles.feedbackBar, { paddingBottom: insets.bottom + 12 }]}>
              <View style={styles.feedbackPanel}>
                {feedbackKey === 'homeInferenceUnavailable' ? (
                  <>
                    <Body style={styles.feedbackHeadline}>{t('homeInferenceUnavailable')}</Body>
                    <Muted style={styles.feedbackSupporting}>{t('homeInferenceUnavailableBody')}</Muted>
                  </>
                ) : (
                  <Body style={styles.feedbackSingle}>{t(feedbackKey)}</Body>
                )}
              </View>
              {!hasRoboflowLiveDetectConfig() ? (
                <Muted style={styles.configHint}>{t('homeRoboflowKeyHint')}</Muted>
              ) : null}
              <View style={styles.btnRow}>
                <AppButton
                  label={t('homeManualCapture')}
                  variant="secondary"
                  disabled={!cameraReady || isCapturing}
                  onPress={() => void manualCapture()}
                />
              </View>
            </View>
          </>
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: brandColors.black,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingBottom: 8,
  },
  closeHit: {
    paddingVertical: 8,
    paddingHorizontal: 10,
  },
  closeText: {
    color: brandColors.gold,
    fontWeight: '700',
    fontSize: 14,
  },
  cameraOuter: {
    flex: 1,
    marginHorizontal: 12,
    marginTop: 4,
    marginBottom: 8,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: brandColors.pourCardStroke,
    overflow: 'hidden',
    backgroundColor: 'rgba(49, 40, 20, 0.3)',
  },
  cameraWrap: {
    flex: 1,
    overflow: 'hidden',
    backgroundColor: '#111',
  },
  guideLayer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  glassShift: {
    transform: [{ translateY: 10 }],
  },
  capturingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  capturingSpinner: {
    paddingVertical: 0,
  },
  feedbackBar: {
    paddingHorizontal: 16,
    paddingTop: 14,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: brandColors.frame,
    backgroundColor: 'rgba(11,11,11,0.96)',
  },
  feedbackPanel: {
    alignSelf: 'stretch',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: brandColors.borderSubtle,
    backgroundColor: 'rgba(29, 24, 15, 0.55)',
    paddingVertical: 14,
    paddingHorizontal: 16,
    gap: 6,
  },
  feedbackHeadline: {
    textAlign: 'center',
    fontSize: 18,
    fontWeight: '700',
    lineHeight: 24,
    color: brandColors.goldBright,
  },
  feedbackSupporting: {
    textAlign: 'center',
    fontSize: 14,
    lineHeight: 20,
    color: brandColors.tanMuted,
  },
  feedbackSingle: {
    textAlign: 'center',
    fontSize: 17,
    fontWeight: '600',
    lineHeight: 24,
    color: brandColors.gold,
  },
  configHint: {
    textAlign: 'center',
    fontSize: 12,
    lineHeight: 18,
    paddingHorizontal: 4,
  },
  btnRow: {
    gap: 10,
  },
  centerBlock: {
    flex: 1,
    justifyContent: 'center',
    padding: 24,
    gap: 14,
  },
  centered: {
    textAlign: 'center',
  },
});
