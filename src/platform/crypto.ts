/**
 * Native crypto for devices (BUILD_PLAN 4.2): react-native-quick-crypto provides `crypto.getRandomValues` and a
 * native scrypt; Hermes alone is far too slow for scrypt with N = 2^17. The web preview falls back to the browser's
 * WebCrypto RNG and the pure-JS scrypt from @noble/hashes.
 */
import { scryptAsync } from '@noble/hashes/scrypt.js';
import { Platform } from 'react-native';
import type { Kdf, ScryptParams } from '../core/vault';

type QuickCrypto = typeof import('react-native-quick-crypto');
// Loaded lazily so the web preview and tests never touch the native module.
// eslint-disable-next-line @typescript-eslint/no-require-imports
const quick = (): QuickCrypto => require('react-native-quick-crypto');

/** Installs the native `crypto` global. Call once at startup, before any key material is created. */
export function installCrypto(): void {
  if (Platform.OS !== 'web') quick().install();
}

/** Work buffer is 128 · r · N bytes (128 MiB for the defaults); allow twice that. */
const maxmem = ({ N, r }: ScryptParams) => 256 * r * N;

export const scryptKdf: Kdf = (password, salt, params) => {
  if (Platform.OS === 'web') return scryptAsync(password, salt, { ...params, dkLen: 32 });
  return new Promise((resolve, reject) => {
    quick().scrypt(password, salt, 32, { N: params.N, r: params.r, p: params.p, maxmem: maxmem(params) }, (err, key) => {
      if (err || !key) return reject(err ?? new Error('scrypt failed'));
      resolve(new Uint8Array(key.buffer, key.byteOffset, key.byteLength));
    });
  });
};
