import { Platform } from 'react-native';
import { router } from 'expo-router';

import HomeScreen from '@/app/(tabs)/index';
import { LivePourCameraModal } from '@/components/pour/live-pour-camera-modal';
import { AppButton } from '@/components/split-the-g/button';
import { submitPourImage } from '@/lib/pour/submit-pour';

jest.mock('expo-router', () => ({ router: { push: jest.fn() } }));
jest.mock('expo-image', () => ({ Image: () => null }));
jest.mock('expo-image-picker', () => ({}));
jest.mock('@/components/auth/auth-sign-in-buttons', () => ({ AuthSignInButtons: () => null }));
jest.mock('@/components/pour/live-pour-camera-modal', () => ({ LivePourCameraModal: () => null }));
jest.mock('@/lib/auth/auth-context', () => ({ useAuth: () => ({ user: null, isConfigured: true }) }));
jest.mock('@/lib/i18n/locale-context', () => ({ useLocale: () => ({ t: (key: string) => key }) }));
jest.mock('@/lib/analytics/client', () => ({ trackEvent: jest.fn() }));
jest.mock('@/lib/pour/offline-queue', () => ({ flushOfflinePourQueue: jest.fn().mockResolvedValue({ synced: 0 }) }));
jest.mock('@/lib/pour/submit-pour', () => ({ submitPourImage: jest.fn() }));
jest.mock('react-native-safe-area-context', () => jest.requireActual('react-native-safe-area-context/jest/mock').default);

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { act, create } = require('react-test-renderer');
const submit = jest.mocked(submitPourImage);
let screen: ReturnType<typeof create>;

function press(label: string) {
  screen.root.findAllByType(AppButton).find((button: { props: { label: string } }) => button.props.label === label).props.onPress();
}

async function capture() {
  await act(async () => { screen = create(<HomeScreen />); });
  await act(async () => press('homeStartAnalysis'));
  await act(async () => screen.root.findByType(LivePourCameraModal).props.onPourFrameCaptured('file:///capture.jpg'));
}

beforeEach(() => {
  jest.replaceProperty(Platform, 'OS', 'ios');
});

afterEach(async () => {
  await act(async () => screen?.unmount());
  jest.restoreAllMocks();
});

it('waits for the iOS camera to dismiss and opens the first successful result once', async () => {
  submit.mockResolvedValueOnce({ success: true, redirectTo: '/en/pour/abc123', scoreId: 'score-1' });
  await capture();
  expect(screen.root.findByType(LivePourCameraModal).props.visible).toBe(false);
  expect(submit).not.toHaveBeenCalled();

  await act(async () => {
    const dismiss = screen.root.findByType(LivePourCameraModal).props.onDismiss;
    dismiss();
    dismiss();
  });
  expect(submit).toHaveBeenCalledTimes(1);
  expect(router.push).toHaveBeenCalledWith('/pour/abc123');
});

it('shows a timeout beside the photo and can retry the same capture without reopening the camera', async () => {
  submit.mockResolvedValueOnce({ success: false, error: 'ANALYSIS_TIMEOUT', status: 504 });
  submit.mockResolvedValueOnce({ success: true, scoreId: 'score-2' });
  await capture();
  await act(async () => screen.root.findByType(LivePourCameraModal).props.onDismiss());
  expect(router.push).not.toHaveBeenCalled();
  expect(screen.root.findAllByProps({ accessibilityRole: 'alert' }).some(
    (element: { props: { children: unknown } }) => element.props.children === 'homeErrAnalysisTimeout',
  )).toBe(true);

  await act(async () => press('homeRetryAnalysis'));
  expect(submit).toHaveBeenCalledTimes(2);
  expect(submit).toHaveBeenLastCalledWith(expect.objectContaining({ imageUri: 'file:///capture.jpg' }));
  expect(router.push).toHaveBeenCalledWith('/pour/score-2');
});
