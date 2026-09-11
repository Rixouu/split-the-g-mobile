import { CameraView, useCameraPermissions } from 'expo-camera';
import { type ElementRef, useCallback, useEffect, useRef, useState } from 'react';
import { Modal, Platform, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppButton } from '@/components/split-the-g/button';
import { ScreenLoadingBlock } from '@/components/split-the-g/screen-loading';
import { Body, Muted } from '@/components/split-the-g/typography';
import { brandColors } from '@/constants/theme';
import { trackEvent } from '@/lib/analytics/client';
import type { TranslationKey } from '@/lib/i18n/translations';

interface LivePourCameraModalProps {
  visible: boolean;
  onClose: () => void;
  /** High-resolution frame sent to the same server-side scoring workflow as the web app. */
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
  const [cameraUnavailable, setCameraUnavailable] = useState(false);
  const [torchOn, setTorchOn] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);
  const cancelledRef = useRef(false);
  const finishedRef = useRef(false);

  useEffect(() => {
    if (!visible) return;
    cancelledRef.current = false;
    finishedRef.current = false;
    setCameraReady(false);
    setCameraUnavailable(false);
    setTorchOn(false);
    setIsCapturing(false);
    return () => {
      cancelledRef.current = true;
    };
  }, [visible]);

  useEffect(() => {
    if (!visible) return;
    if (!permission?.granted) void requestPermission();
  }, [visible, permission?.granted, requestPermission]);

  const captureAndAnalyze = useCallback(async () => {
    const camera = cameraRef.current;
    if (!camera || cancelledRef.current || finishedRef.current || !cameraReady) return;

    finishedRef.current = true;
    setIsCapturing(true);
    try {
      const shot = await camera.takePictureAsync({
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
      trackEvent('mobile_pour_camera_captured', {});
      onPourFrameCaptured(shot.uri);
    } catch {
      finishedRef.current = false;
      setCameraUnavailable(true);
    } finally {
      if (!cancelledRef.current) setIsCapturing(false);
    }
  }, [cameraReady, onPourFrameCaptured]);

  if (!visible) return null;

  return (
    <Modal visible={visible} animationType="slide" statusBarTranslucent onRequestClose={onClose}>
      <View style={[styles.root, { paddingTop: insets.top + 8 }]}>
        <View style={styles.topBar}>
          <Pressable
            onPress={onClose}
            hitSlop={8}
            style={styles.topBarAction}
            accessibilityRole="button"
            accessibilityLabel={t('homeCloseLiveCamera')}>
            <Body style={styles.topBarText}>{t('homeCloseLiveCamera')}</Body>
          </Pressable>
          <Pressable
            onPress={() => setTorchOn((value) => !value)}
            hitSlop={8}
            style={styles.topBarAction}
            accessibilityRole="button"
            accessibilityLabel={torchOn ? t('homeTorchOff') : t('homeTorchOn')}>
            <Body style={styles.topBarText}>{torchOn ? t('homeTorchOff') : t('homeTorchOn')}</Body>
          </Pressable>
        </View>

        {!permission?.granted ? (
          <View style={styles.centerBlock}>
            <Muted style={styles.centered}>{t('homeCameraPermission')}</Muted>
            <AppButton
              label={t('homeRequestCameraPermission')}
              onPress={() => void requestPermission()}
            />
            <AppButton label={t('homeCloseLiveCamera')} variant="secondary" onPress={onClose} />
          </View>
        ) : (
          <>
            <View style={styles.cameraOuter}>
              <CameraView
                ref={cameraRef}
                style={StyleSheet.absoluteFill}
                facing="back"
                mode="picture"
                {...(Platform.OS === 'android' ? { ratio: '4:3' as const } : {})}
                enableTorch={torchOn}
                onCameraReady={() => {
                  setCameraUnavailable(false);
                  setCameraReady(true);
                }}
                onMountError={() => {
                  setCameraReady(false);
                  setCameraUnavailable(true);
                }}
              />

              <View
                style={styles.guideLayer}
                pointerEvents="none"
                accessibilityElementsHidden
                importantForAccessibility="no-hide-descendants">
                <View style={styles.guideFrame}>
                  <View style={[styles.corner, styles.cornerTopLeft]} />
                  <View style={[styles.corner, styles.cornerTopRight]} />
                  <View style={[styles.corner, styles.cornerBottomLeft]} />
                  <View style={[styles.corner, styles.cornerBottomRight]} />
                  <View style={[styles.guidePill, styles.guidePillTop]}>
                    <Body style={styles.guidePillText}>{t('homeGuideFullPint')}</Body>
                  </View>
                  <View style={[styles.guidePill, styles.guidePillBottom]}>
                    <Body style={styles.guidePillText}>{t('homeGuideGVisible')}</Body>
                  </View>
                </View>
              </View>

              {isCapturing ? (
                <View style={styles.capturingOverlay}>
                  <ScreenLoadingBlock showCaption={false} dense style={styles.capturingSpinner} />
                </View>
              ) : null}
            </View>

            <View style={[styles.captureBar, { paddingBottom: insets.bottom + 12 }]}>
              <View style={styles.feedbackPanel}>
                <Body style={styles.feedbackHeadline}>
                  {cameraUnavailable ? t('homeCameraUnavailable') : t('homeCameraReady')}
                </Body>
                <Muted style={styles.feedbackSupporting}>
                  {cameraUnavailable ? t('homeCameraUnavailableBody') : t('homeCameraReadyBody')}
                </Muted>
              </View>
              <AppButton
                label={t('homeCaptureAnalyze')}
                fullWidth
                disabled={!cameraReady || isCapturing || cameraUnavailable}
                onPress={() => void captureAndAnalyze()}
              />
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
  topBarAction: {
    minHeight: 40,
    justifyContent: 'center',
    paddingHorizontal: 10,
  },
  topBarText: {
    color: brandColors.gold,
    fontWeight: '700',
    fontSize: 14,
  },
  cameraOuter: {
    flex: 1,
    marginHorizontal: 12,
    marginTop: 4,
    marginBottom: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: brandColors.pourCardStroke,
    overflow: 'hidden',
    backgroundColor: '#111',
  },
  guideLayer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 26,
    paddingVertical: 34,
  },
  guideFrame: {
    width: '100%',
    height: '100%',
    maxWidth: 430,
    borderRadius: 28,
    borderWidth: 1,
    borderColor: 'rgba(198, 156, 54, 0.35)',
  },
  corner: {
    position: 'absolute',
    width: 46,
    height: 46,
    borderColor: brandColors.goldBright,
  },
  cornerTopLeft: {
    top: -2,
    left: -2,
    borderTopWidth: 4,
    borderLeftWidth: 4,
    borderTopLeftRadius: 28,
  },
  cornerTopRight: {
    top: -2,
    right: -2,
    borderTopWidth: 4,
    borderRightWidth: 4,
    borderTopRightRadius: 28,
  },
  cornerBottomLeft: {
    bottom: -2,
    left: -2,
    borderBottomWidth: 4,
    borderLeftWidth: 4,
    borderBottomLeftRadius: 28,
  },
  cornerBottomRight: {
    right: -2,
    bottom: -2,
    borderRightWidth: 4,
    borderBottomWidth: 4,
    borderBottomRightRadius: 28,
  },
  guidePill: {
    position: 'absolute',
    alignSelf: 'center',
    maxWidth: '88%',
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(198, 156, 54, 0.62)',
    backgroundColor: 'rgba(8, 8, 8, 0.78)',
    paddingVertical: 7,
    paddingHorizontal: 14,
  },
  guidePillTop: {
    top: 18,
  },
  guidePillBottom: {
    bottom: 18,
  },
  guidePillText: {
    color: brandColors.cream,
    textAlign: 'center',
    fontWeight: '700',
    fontSize: 13,
    lineHeight: 18,
  },
  capturingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.42)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  capturingSpinner: {
    paddingVertical: 0,
  },
  captureBar: {
    paddingHorizontal: 16,
    paddingTop: 12,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: brandColors.frame,
    backgroundColor: 'rgba(11,11,11,0.98)',
  },
  feedbackPanel: {
    alignSelf: 'stretch',
    paddingHorizontal: 8,
    gap: 3,
  },
  feedbackHeadline: {
    textAlign: 'center',
    fontSize: 18,
    fontWeight: '800',
    lineHeight: 24,
    color: brandColors.goldBright,
  },
  feedbackSupporting: {
    textAlign: 'center',
    fontSize: 13,
    lineHeight: 18,
    color: brandColors.tanMuted,
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
