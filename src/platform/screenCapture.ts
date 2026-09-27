/**
 * Screenshot and app-switcher protection (BUILD_PLAN 5.3/5.4, product owner decision 2026-09-27):
 * - Android: FLAG_SECURE only while a phrase screen is shown (blocks screenshots, recording and the recents preview).
 * - iOS: screenshots cannot be blocked; screen recording is covered by the system blur of the app-switcher
 *   protection, and a screenshot on a phrase screen shows a warning.
 * - All platforms: App.tsx covers the UI while the app is not active (app switcher).
 */
import { useEffect, useRef } from 'react';
import { Platform } from 'react-native';
import * as ScreenCapture from 'expo-screen-capture';

const native = Platform.OS === 'ios' || Platform.OS === 'android';

/** iOS only: system blur over the app snapshot in the app switcher. Call once at startup. */
export function enableAppSwitcherProtection(): void {
  if (Platform.OS === 'ios') void ScreenCapture.enableAppSwitcherProtectionAsync(0.9);
}

/** While `active`: Android blocks capture, iOS reports screenshots via `onScreenshot`. */
export function useSecureScreen(active: boolean, onScreenshot: () => void): void {
  const cb = useRef(onScreenshot);
  useEffect(() => {
    cb.current = onScreenshot;
  });
  useEffect(() => {
    if (!active || !native) return;
    if (Platform.OS === 'android') {
      void ScreenCapture.preventScreenCaptureAsync('phrase');
      return () => void ScreenCapture.allowScreenCaptureAsync('phrase');
    }
    const sub = ScreenCapture.addScreenshotListener(() => cb.current());
    return () => sub.remove();
  }, [active]);
}

/** Design text under the phrase; iOS cannot block screenshots, so the wording changes there (BUILD_PLAN 5.4). */
export const PHRASE_BADGES: readonly [string, string] =
  Platform.OS === 'ios' ? ['Kopieren deaktiviert', 'Keine Screenshots machen'] : ['Screenshots blockiert', 'Kopieren deaktiviert'];
