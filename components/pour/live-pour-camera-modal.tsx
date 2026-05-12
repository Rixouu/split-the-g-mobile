import { CameraView, useCameraPermissions } from 'expo-camera';
import { type ElementRef, useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppButton } from '@/components/split-the-g/button';
import { Body, Muted, Title } from '@/components/split-the-g/typography';
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
              {isCapturing ? (
                <View style={styles.capturingOverlay}>
                  <ActivityIndicator size="large" color={brandColors.gold} />
                </View>
              ) : null}
            </View>

            <View style={[styles.feedbackBar, { paddingBottom: insets.bottom + 12 }]}>
              <Title style={styles.feedbackTitle}>{t(feedbackKey)}</Title>
              {!hasRoboflowLiveDetectConfig() ? (
                <Muted style={styles.hint}>{t('homeRoboflowKeyHint')}</Muted>
              ) : null}
              {isInferenceUnavailable && hasRoboflowLiveDetectConfig() ? (
                <Muted style={styles.hint}>{t('homeInferenceUnavailable')}</Muted>
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
  cameraWrap: {
    flex: 1,
    marginHorizontal: 0,
    borderRadius: 0,
    overflow: 'hidden',
    backgroundColor: '#111',
  },
  capturingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  feedbackBar: {
    paddingHorizontal: 16,
    paddingTop: 14,
    gap: 10,
    borderTopWidth: 1,
    borderTopColor: brandColors.frame,
    backgroundColor: 'rgba(11,11,11,0.96)',
  },
  feedbackTitle: {
    textAlign: 'center',
    fontSize: 17,
    color: brandColors.gold,
  },
  hint: {
    textAlign: 'center',
    fontSize: 13,
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
