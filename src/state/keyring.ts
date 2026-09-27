/**
 * The only way to key material (BUILD_PLAN 4.6, 5.3). The vault holds the encrypted entropy; after unlocking, the
 * session keeps public data only. Every signature (and "show phrase") decrypts the vault again with the PIN, derives
 * just the needed key, runs the callback and wipes all byte arrays afterwards (best effort).
 *
 * PIN attempt counting and lockout (5.3) sit on top of this in Phase 2.
 */
import { base64 } from '@scure/base';
import type { Family, Network } from '../core/address';
import { randomBytes, wipe } from '../core/bytes';
import { deriveKey, derivePublic, seedFromEntropy, type AccountPublic, type BtcChain, type KeyMaterial } from '../core/derive';
import { toMnemonic } from '../core/mnemonic';
import { DEFAULT_SCRYPT, DEVICE_SECRET_BYTES, decryptVault, encryptVault, type Kdf, type ScryptParams } from '../core/vault';
import type { SecureStore } from '../platform/secureStore';

export const STORE_KEYS = {
  vault: 'anthea.vault',
  deviceSecret: 'anthea.deviceSecret',
  accounts: 'anthea.accounts',
  /** Written during PIN change before replacing the vault (atomic re-encryption, BUILD_PLAN 5.3). */
  vaultNext: 'anthea.vault.next',
  /** Wrong-PIN counter and lockout (state/session.ts); survives restarts, cleared only by a correct PIN or reset. */
  pinAttempts: 'anthea.pinAttempts',
} as const;

export type KeyringErrorCode = 'no-wallet' | 'wallet-exists' | 'device-secret-missing' | 'wrong-pin';

export class KeyringError extends Error {
  constructor(readonly code: KeyringErrorCode) {
    super(`Keyring error: ${code}`);
    this.name = 'KeyringError';
  }
}

/** Key material handed to a `withSigner` callback. `privateKey` is zeroed as soon as the callback settles. */
export type Signer = Readonly<KeyMaterial>;

export interface SignerOptions {
  /** Bitcoin only: receive (default) or change chain. */
  chain?: BtcChain;
}

export interface KeyringDeps {
  store: SecureStore;
  kdf: Kdf;
  /** Overridable for tests; production always uses DEFAULT_SCRYPT. */
  scrypt?: ScryptParams;
}

export function createKeyring({ store, kdf, scrypt = DEFAULT_SCRYPT }: KeyringDeps) {
  async function deviceSecret(): Promise<Uint8Array> {
    const stored = await store.get(STORE_KEYS.deviceSecret);
    if (!stored) throw new KeyringError('device-secret-missing');
    return base64.decode(stored);
  }

  /** Decrypts the entropy; maps every decryption failure to 'wrong-pin'. The caller wipes the result. */
  async function openVault(pin: string): Promise<Uint8Array> {
    const vault = await store.get(STORE_KEYS.vault);
    if (!vault) throw new KeyringError('no-wallet');
    const secret = await deviceSecret();
    try {
      return await decryptVault(vault, pin, secret, kdf);
    } catch (e) {
      if ((e as { code?: string }).code === 'decrypt-failed') throw new KeyringError('wrong-pin');
      throw e;
    } finally {
      wipe(secret);
    }
  }

  async function publicFromEntropy(entropy: Uint8Array, network: Network): Promise<AccountPublic> {
    const seed = await seedFromEntropy(entropy);
    try {
      return derivePublic(seed, network);
    } finally {
      wipe(seed);
    }
  }

  return {
    async hasWallet(): Promise<boolean> {
      return (await store.get(STORE_KEYS.vault)) !== null;
    },

    /**
     * Stores a new wallet: fresh device secret, encrypted entropy and the public addresses. Refuses to overwrite an
     * existing wallet (reset first). The caller keeps ownership of `entropy` and wipes it.
     */
    async create(entropy: Uint8Array, pin: string, network: Network): Promise<AccountPublic> {
      if (await this.hasWallet()) throw new KeyringError('wallet-exists');
      const secret = randomBytes(DEVICE_SECRET_BYTES);
      try {
        const vault = await encryptVault(entropy, pin, secret, kdf, scrypt);
        const accounts = await publicFromEntropy(entropy, network);
        await store.set(STORE_KEYS.deviceSecret, base64.encode(secret));
        await store.set(STORE_KEYS.accounts, JSON.stringify(accounts));
        await store.set(STORE_KEYS.vault, vault);
        return accounts;
      } finally {
        wipe(secret);
      }
    },

    /** Checks the PIN by decrypting the vault and returns the stored public data. No key material is kept. */
    async unlock(pin: string): Promise<AccountPublic> {
      wipe(await openVault(pin));
      const accounts = await store.get(STORE_KEYS.accounts);
      if (!accounts) throw new KeyringError('no-wallet');
      return JSON.parse(accounts) as AccountPublic;
    },

    /**
     * Runs `fn` with one derived key and wipes seed, entropy and the private key afterwards, also when `fn` throws.
     * `fn` must not keep the key beyond its own execution.
     */
    async withSigner<T>(pin: string, family: Family, index: number, fn: (signer: Signer) => Promise<T>, options: SignerOptions = {}): Promise<T> {
      const accounts = await store.get(STORE_KEYS.accounts);
      if (!accounts) throw new KeyringError('no-wallet');
      const { network } = JSON.parse(accounts) as AccountPublic;
      const entropy = await openVault(pin);
      let seed: Uint8Array | undefined;
      let key: KeyMaterial | undefined;
      try {
        seed = await seedFromEntropy(entropy);
        key = deriveKey(seed, family, network, index, options.chain);
        wipe(seed, entropy);
        return await fn(key);
      } finally {
        wipe(seed, entropy, key?.privateKey);
      }
    },

    /** The recovery phrase for "Phrase anzeigen" (PIN required). Strings cannot be wiped; show and drop it quickly. */
    async revealPhrase(pin: string): Promise<string[]> {
      const entropy = await openVault(pin);
      try {
        return toMnemonic(entropy).split(' ');
      } finally {
        wipe(entropy);
      }
    },

    /**
     * Re-encrypts the vault with a new PIN: the new blob is written to a temporary key and verified before it
     * replaces the old one, so an interruption never leaves the wallet without a readable vault.
     */
    async changePin(oldPin: string, newPin: string): Promise<void> {
      const entropy = await openVault(oldPin);
      const secret = await deviceSecret();
      try {
        const next = await encryptVault(entropy, newPin, secret, kdf, scrypt);
        await store.set(STORE_KEYS.vaultNext, next);
        const check = await decryptVault((await store.get(STORE_KEYS.vaultNext))!, newPin, secret, kdf);
        const same = check.length === entropy.length && check.every((b, i) => b === entropy[i]);
        wipe(check);
        if (!same) throw new Error('Vault verification failed');
        await store.set(STORE_KEYS.vault, next);
      } finally {
        await store.delete(STORE_KEYS.vaultNext);
        wipe(entropy, secret);
      }
    },

    /** Replaces the stored public data, e.g. after the Bitcoin scan found more used addresses. */
    async saveAccounts(accounts: AccountPublic): Promise<void> {
      if (!(await this.hasWallet())) throw new KeyringError('no-wallet');
      await store.set(STORE_KEYS.accounts, JSON.stringify(accounts));
    },

    /** Deletes vault, device secret, public data and the PIN attempt counter (BUILD_PLAN 5.3 "Wallet zurücksetzen"). */
    async reset(): Promise<void> {
      for (const key of Object.values(STORE_KEYS)) await store.delete(key);
    },
  };
}

export type Keyring = ReturnType<typeof createKeyring>;
