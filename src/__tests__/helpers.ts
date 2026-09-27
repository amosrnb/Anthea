import { mnemonicToEntropy } from '@scure/bip39';
import { wordlist } from '@scure/bip39/wordlists/english.js';
import { FAST_SCRYPT, nodeKdf } from '../core/__tests__/nodeKdf';
import { createMemorySecureStore } from '../platform/secureStore';
import { createMemorySettings } from '../platform/settings';
import type { WalletDeps } from '../state/appServices';
import { createKeyring } from '../state/keyring';
import { createSession } from '../state/session';

export const ABOUT = 'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about';
export const PIN = '123456';

/** Test services: in-memory secure store and settings, fast scrypt, a controllable clock, no network. */
export async function makeDeps({ wallet = false }: { wallet?: boolean } = {}) {
  const store = createMemorySecureStore();
  const keyring = createKeyring({ store, kdf: nodeKdf, scrypt: FAST_SCRYPT });
  const clock = { t: Date.parse('2026-09-27T10:00:00Z') };
  const deps: WalletDeps = {
    session: createSession({ keyring, store, now: () => clock.t }),
    settings: createMemorySettings(),
    isBtcAddressUsed: jest.fn(async () => false),
    readClipboard: jest.fn(async () => ''),
    now: () => clock.t,
  };
  if (wallet) await keyring.create(mnemonicToEntropy(ABOUT, wordlist), PIN, 'testnet');
  return { deps, store, keyring, clock };
}
