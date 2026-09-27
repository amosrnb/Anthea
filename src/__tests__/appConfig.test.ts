import config from '../../app.config';

describe('app.config', () => {
  const blocked = config.android?.blockedPermissions ?? [];

  it('keeps photo and storage access out of the Android build', () => {
    expect(blocked).toEqual(expect.arrayContaining(['android.permission.READ_EXTERNAL_STORAGE', 'android.permission.READ_MEDIA_IMAGES']));
  });

  it('keeps DETECT_SCREEN_CAPTURE, which expo-screen-capture needs on Android 14+ at startup', () => {
    expect(blocked).not.toContain('android.permission.DETECT_SCREEN_CAPTURE');
  });
});
