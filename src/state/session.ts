/**
 * Every PIN entry goes through here so the attempt limit (BUILD_PLAN 5.3) applies to unlocking, showing the phrase,
 * signing and changing the PIN alike. The counter lives in secure storage and survives restarts.
 */
import type { Network } from '../core/address';
import type { AccountPublic } from '../core/derive';
import { attemptsLeft, lockRemaining, NO_ATTEMPTS, parseAttempts, registerFailure, type PinAttempts } from '../core/pinPolicy';
import type { SecureStore } from '../platform/secureStore';
import { KeyringError, STORE_KEYS, type Keyring } from './keyring';

export type PinCheck<T> =
  | { ok: true; value: T }
  /** Wrong PIN; `left` attempts remain before the first wait, `lockedFor` > 0 if this failure started a wait. */
  | { ok: false; reason: 'wrong-pin'; left: number; lockedFor: number }
  /** Still waiting from earlier failures; the PIN was not checked. */
  | { ok: false; reason: 'locked'; lockedFor: number };

export interface SessionDeps {
  keyring: Keyring;
  store: SecureStore;
  now?: () => number;
}

export function createSession({ keyring, store, now = Date.now }: SessionDeps) {
  const read = async (): Promise<PinAttempts> => parseAttempts(await store.get(STORE_KEYS.pinAttempts));
  const write = (a: PinAttempts) => store.set(STORE_KEYS.pinAttempts, JSON.stringify(a));

  /** Runs `op` with the PIN unless a wait is active; counts wrong PINs, resets the counter on success. */
  async function guarded<T>(op: () => Promise<T>): Promise<PinCheck<T>> {
    const attempts = await read();
    const waiting = lockRemaining(attempts, now());
    if (waiting > 0) return { ok: false, reason: 'locked', lockedFor: waiting };
    try {
      const value = await op();
      if (attempts.failures > 0) await write(NO_ATTEMPTS);
      return { ok: true, value };
    } catch (e) {
      if (!(e instanceof KeyringError) || e.code !== 'wrong-pin') throw e;
      const next = registerFailure(attempts, now());
      await write(next);
      return { ok: false, reason: 'wrong-pin', left: attemptsLeft(next), lockedFor: lockRemaining(next, now()) };
    }
  }

  return {
    hasWallet: () => keyring.hasWallet(),
    /** Remaining wait from earlier failures (0 = PIN entry allowed), e.g. to show the countdown after a restart. */
    lockedFor: async () => lockRemaining(await read(), now()),
    create: async (entropy: Uint8Array, pin: string, network: Network) => {
      await write(NO_ATTEMPTS);
      return keyring.create(entropy, pin, network);
    },
    saveAccounts: (accounts: AccountPublic) => keyring.saveAccounts(accounts),
    unlock: (pin: string) => guarded(() => keyring.unlock(pin)),
    verifyPin: (pin: string) => guarded(async () => void (await keyring.unlock(pin))),
    revealPhrase: (pin: string) => guarded(() => keyring.revealPhrase(pin)),
    changePin: (oldPin: string, newPin: string) => guarded(() => keyring.changePin(oldPin, newPin)),
    withSigner: <T>(...args: Parameters<Keyring['withSigner']>) => guarded(() => keyring.withSigner(...args) as Promise<T>),
    reset: () => keyring.reset(),
  };
}

export type Session = ReturnType<typeof createSession>;
