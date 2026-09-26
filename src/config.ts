import { Platform } from 'react-native';
import type { WalletProps } from './useWallet';

/**
 * Prototype tweak props (BUILD_PLAN section 3; removed in Phase 2). The web build reads them from the URL
 * (`?start=welcome|lock|home`, `?testnet=0`, `?privacy=1`) for the visual comparison with the prototype;
 * native builds always start with onboarding in testnet mode.
 */
export function prototypeProps(): WalletProps {
  const q = Platform.OS === 'web' && typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
  const start = q?.get('start');
  return {
    startScreen: start === 'lock' || start === 'home' ? start : 'welcome',
    testnet: q?.get('testnet') !== '0',
    privacyMode: q?.get('privacy') === '1',
  };
}
