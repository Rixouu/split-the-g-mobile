import * as FileSystem from 'expo-file-system/legacy';
import * as ImageManipulator from 'expo-image-manipulator';

import { submitPourImage } from '../submit-pour';

jest.mock('expo-file-system/legacy', () => ({
  getInfoAsync: jest.fn(),
  readAsStringAsync: jest.fn(),
  deleteAsync: jest.fn().mockResolvedValue(undefined),
}));
jest.mock('expo-image-manipulator', () => ({
  manipulateAsync: jest.fn(),
  SaveFormat: { JPEG: 'jpeg' },
}));
jest.mock('@/lib/pour/session', () => ({ getPourSessionId: jest.fn().mockResolvedValue('session-1') }));
jest.mock('@/lib/config', () => ({ appConfig: { apiBaseUrl: 'https://example.test' } }));

const getInfoAsync = FileSystem.getInfoAsync as jest.Mock;
const readAsStringAsync = FileSystem.readAsStringAsync as jest.Mock;
const manipulateAsync = ImageManipulator.manipulateAsync as jest.Mock;

function formValue(body: FormData, key: string): string | undefined {
  return body.get(key)?.toString();
}

describe('submitPourImage', () => {
  beforeEach(() => {
    getInfoAsync.mockResolvedValue({ exists: true, size: 1024, modificationTime: 1_700_000_000 });
    readAsStringAsync.mockResolvedValue('/9j/abcd');
    manipulateAsync.mockResolvedValue({ uri: 'file:///small.jpg', width: 1600, height: 1200 });
    global.fetch = jest.fn().mockResolvedValue({
      status: 200,
      json: jest.fn().mockResolvedValue({ success: true, scoreId: 'score-1' }),
    }) as typeof fetch;
  });

  it('sends Expo file time in the milliseconds expected by the scoring API', async () => {
    await submitPourImage({ imageUri: 'file:///photo.jpg' });

    const [, request] = (global.fetch as jest.Mock).mock.calls[0];
    expect(formValue(request.body, 'clientFileLastModifiedMs')).toBe('1700000000000');
  });

  it('rejects photos above the web upload limit before encoding them', async () => {
    getInfoAsync.mockResolvedValue({
      exists: true,
      size: 18 * 1024 * 1024 + 1,
      modificationTime: 1_700_000_000,
    });

    await expect(submitPourImage({ imageUri: 'file:///large.jpg' })).resolves.toMatchObject({
      success: false,
      error: 'IMAGE_TOO_LARGE',
    });
    expect(readAsStringAsync).not.toHaveBeenCalled();
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('compresses large photos before sending them through the API', async () => {
    getInfoAsync.mockImplementation(async (uri: string) => ({
      exists: true,
      size: uri === 'file:///photo.jpg' ? 5_000_000 : 2_000_000,
      modificationTime: 1_700_000_000,
    }));

    await submitPourImage({ imageUri: 'file:///photo.jpg' });

    expect(manipulateAsync).toHaveBeenCalledWith('file:///photo.jpg', [], {
      compress: 0.78,
      format: 'jpeg',
    });
    expect(readAsStringAsync).toHaveBeenCalledWith('file:///small.jpg', { encoding: 'base64' });
    const [, request] = (global.fetch as jest.Mock).mock.calls[0];
    expect(formValue(request.body, 'clientFileLastModifiedMs')).toBe('1700000000000');
    expect(FileSystem.deleteAsync).toHaveBeenCalledWith('file:///small.jpg', { idempotent: true });
  });

  it('shows a photo size error for a 413 response from the host', async () => {
    global.fetch = jest.fn().mockResolvedValue({ status: 413 }) as typeof fetch;

    await expect(submitPourImage({ imageUri: 'file:///photo.jpg' })).resolves.toMatchObject({
      success: false,
      error: 'IMAGE_TOO_LARGE',
      status: 413,
    });
  });

  it('reports the HTTP status when the scoring API returns non-JSON', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      status: 502,
      json: jest.fn().mockRejectedValue(new SyntaxError('Unexpected token')),
    }) as typeof fetch;

    await expect(submitPourImage({ imageUri: 'file:///photo.jpg' })).resolves.toMatchObject({
      success: false,
      error: 'INVALID_RESPONSE',
      status: 502,
      detail: expect.stringContaining('HTTP 502'),
    });
  });
});
