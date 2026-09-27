/**
 * Encrypted container for the seed entropy (BUILD_PLAN 5.2). No I/O: storage and the scrypt implementation are
 * passed in, so the same code runs with react-native-quick-crypto on devices and in Node for tests.
 *
 *   pinKey   = scrypt(PIN, salt, N, r, p)            32 bytes
 *   vaultKey = HKDF-SHA256(pinKey ‖ deviceSecret, info = "anthea-vault-v1")
 *   blob     = AES-256-GCM(vaultKey, nonce, entropy, AAD = header)
 *
 * A 6-digit PIN alone has 10^6 possibilities; the device secret (random, never leaves the device) makes offline
 * brute force of an extracted blob impossible without it.
 */
import { gcm } from '@noble/ciphers/aes.js';
import { hkdf } from '@noble/hashes/hkdf.js';
import { sha256 } from '@noble/hashes/sha2.js';
import { base64 } from '@scure/base';
import { concatBytes, randomBytes, utf8, wipe } from './bytes';

export const VAULT_VERSION = 1;
export const HKDF_INFO = 'anthea-vault-v1';
export const DEVICE_SECRET_BYTES = 32;

export interface ScryptParams {
  N: number;
  r: number;
  p: number;
}

/** BUILD_PLAN 5.2: N = 2^17, r = 8, p = 1 (≈128 MiB). Stored in every header so they can change later. */
export const DEFAULT_SCRYPT: ScryptParams = { N: 2 ** 17, r: 8, p: 1 };

/** scrypt with a 32-byte output. Implementations: platform/crypto.ts (device), Node/noble in tests. */
export type Kdf = (password: Uint8Array, salt: Uint8Array, params: ScryptParams) => Promise<Uint8Array>;

interface Header {
  v: number;
  kdf: 'scrypt';
  N: number;
  r: number;
  p: number;
  salt: string;
  nonce: string;
}

/** Serialized vault: the header JSON is kept verbatim because its exact bytes are the AEAD associated data. */
interface Blob {
  h: string;
  c: string;
}

export type VaultErrorCode = 'invalid-pin-format' | 'corrupt' | 'unsupported-version' | 'decrypt-failed' | 'invalid-entropy';

export class VaultError extends Error {
  constructor(readonly code: VaultErrorCode) {
    // Deliberately generic: messages must never contain PINs, keys or plaintext.
    super(`Vault error: ${code}`);
    this.name = 'VaultError';
  }
}

export const isValidPin = (pin: string): boolean => /^\d{6}$/.test(pin);

async function vaultKey(pin: string, deviceSecret: Uint8Array, salt: Uint8Array, params: ScryptParams, kdf: Kdf): Promise<Uint8Array> {
  if (!isValidPin(pin)) throw new VaultError('invalid-pin-format');
  const pinBytes = utf8(pin);
  const pinKey = await kdf(pinBytes, salt, params);
  const ikm = concatBytes(pinKey, deviceSecret);
  const key = hkdf(sha256, ikm, undefined, utf8(HKDF_INFO), 32);
  wipe(pinBytes, pinKey, ikm);
  return key;
}

/** Encrypts 16- or 32-byte BIP39 entropy with the PIN and device secret; returns the string to store. */
export async function encryptVault(
  entropy: Uint8Array,
  pin: string,
  deviceSecret: Uint8Array,
  kdf: Kdf,
  params: ScryptParams = DEFAULT_SCRYPT,
): Promise<string> {
  if (entropy.length !== 16 && entropy.length !== 32) throw new VaultError('invalid-entropy');
  const salt = randomBytes(16);
  const nonce = randomBytes(12);
  const header: Header = { v: VAULT_VERSION, kdf: 'scrypt', N: params.N, r: params.r, p: params.p, salt: base64.encode(salt), nonce: base64.encode(nonce) };
  const h = JSON.stringify(header);
  const key = await vaultKey(pin, deviceSecret, salt, params, kdf);
  const ciphertext = gcm(key, nonce, utf8(h)).encrypt(entropy);
  wipe(key);
  const blob: Blob = { h, c: base64.encode(ciphertext) };
  return JSON.stringify(blob);
}

function parse(serialized: string): { header: Header; h: string; ciphertext: Uint8Array } {
  let blob: Blob;
  let header: Header;
  try {
    blob = JSON.parse(serialized);
    header = JSON.parse(blob.h);
  } catch {
    throw new VaultError('corrupt');
  }
  if (header.v !== VAULT_VERSION || header.kdf !== 'scrypt') throw new VaultError('unsupported-version');
  const { N, r, p } = header;
  // Bounds keep a tampered header from requesting absurd memory or time.
  const valid = [N, r, p].every(Number.isSafeInteger) && N >= 2 && N <= 2 ** 20 && (N & (N - 1)) === 0 && r >= 1 && r <= 32 && p >= 1 && p <= 16;
  if (!valid) throw new VaultError('corrupt');
  try {
    return { header, h: blob.h, ciphertext: base64.decode(blob.c) };
  } catch {
    throw new VaultError('corrupt');
  }
}

/**
 * Decrypts the entropy. A wrong PIN, a different device secret and any change to header or ciphertext all fail the
 * GCM tag check and surface as the same 'decrypt-failed' error. The caller must wipe the result.
 */
export async function decryptVault(serialized: string, pin: string, deviceSecret: Uint8Array, kdf: Kdf): Promise<Uint8Array> {
  const { header, h, ciphertext } = parse(serialized);
  let salt: Uint8Array, nonce: Uint8Array;
  try {
    salt = base64.decode(header.salt);
    nonce = base64.decode(header.nonce);
  } catch {
    throw new VaultError('corrupt');
  }
  const key = await vaultKey(pin, deviceSecret, salt, header, kdf);
  try {
    return gcm(key, nonce, utf8(h)).decrypt(ciphertext);
  } catch {
    throw new VaultError('decrypt-failed');
  } finally {
    wipe(key);
  }
}

/** The scrypt parameters a stored vault was written with (e.g. to measure or migrate). */
export const vaultParams = (serialized: string): ScryptParams => {
  const { N, r, p } = parse(serialized).header;
  return { N, r, p };
};
