/** Wiring of the real services for the app; tests pass their own `WalletDeps` instead. */
import { Platform } from 'react-native';
import type { Network } from '../core/address';
import { readClipboardText } from '../platform/clipboard';
import { scryptKdf } from '../platform/crypto';
import { createMemorySecureStore, createExpoSecureStore } from '../platform/secureStore';
import { createMmkvSettings, type Settings } from '../platform/settings';
import { addressUsed } from '../services/esplora';
import { createKeyring } from './keyring';
import { createSession, type Session } from './session';

export interface WalletDeps {
  session: Session;
  settings: Settings;
  /** Bitcoin gap-limit scan lookup (Esplora). */
  isBtcAddressUsed: (address: string, network: Network) => Promise<boolean>;
  readClipboard: () => Promise<string>;
  now: () => number;
}

let instance: WalletDeps | undefined;

export function appServices(): WalletDeps {
  if (instance) return instance;
  // expo-secure-store has no web implementation; the web preview (visual comparison only, never a product
  // target) keeps its wallet in memory for the page's lifetime.
  const store = Platform.OS === 'web' ? createMemorySecureStore() : createExpoSecureStore();
  const keyring = createKeyring({ store, kdf: scryptKdf });
  instance = {
    session: createSession({ keyring, store }),
    settings: createMmkvSettings(),
    isBtcAddressUsed: (address, network) => addressUsed(address, network),
    readClipboard: readClipboardText,
    now: () => Date.now(),
  };
  return instance;
}
