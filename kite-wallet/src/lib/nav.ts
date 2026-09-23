import { router } from 'expo-router';

/** Return to Home: pop when we came from there, otherwise replace (e.g. after a deep link). */
export function goHome() {
  if (router.canGoBack()) router.back();
  else router.replace('/home');
}
