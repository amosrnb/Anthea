import type { ExpoConfig } from 'expo/config';

// Placeholder app ID for development builds. The final ID depends on the domain Anthea will own
// (BUILD_PLAN 13.1 #9 and open point 13.2 #2) and cannot be changed after the first store release.
// TODO(13.2): replace with the reverse-domain ID before the first release.
const APP_ID = 'dev.anthea.wallet';

const config: ExpoConfig = {
  name: 'Anthea',
  slug: 'anthea',
  version: '0.1.0',
  orientation: 'portrait',
  icon: './assets/icon.png',
  userInterfaceStyle: 'dark',
  backgroundColor: '#000000',
  ios: {
    bundleIdentifier: APP_ID,
    supportsTablet: false,
    infoPlist: { ITSAppUsesNonExemptEncryption: false },
  },
  android: {
    package: APP_ID,
    // Keep wallet data out of Google cloud backup and device transfer (BUILD_PLAN 5.2 #6).
    allowBackup: false,
    adaptiveIcon: {
      backgroundColor: '#000000',
      foregroundImage: './assets/android-icon-foreground.png',
      backgroundImage: './assets/android-icon-background.png',
      monochromeImage: './assets/android-icon-monochrome.png',
    },
    predictiveBackGestureEnabled: false,
    // expo-screen-capture declares these for screenshot detection on older Android; Anthea only uses FLAG_SECURE
    // there and must not read the user's photos or storage.
    blockedPermissions: ['android.permission.READ_EXTERNAL_STORAGE', 'android.permission.READ_MEDIA_IMAGES', 'android.permission.DETECT_SCREEN_CAPTURE'],
  },
  web: { favicon: './assets/favicon.png' },
  plugins: [
    'expo-font',
    // No biometrics in v1 (BUILD_PLAN 13.1 #3): no Face ID usage description. The default Android backup and
    // data-extraction rules keep secure-store data out of cloud backup and device-to-device transfer (5.2 #6).
    ['expo-secure-store', { faceIDPermission: false }],
    'react-native-quick-crypto',
  ],
};

export default config;
