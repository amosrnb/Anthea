/** Byte helpers shared by the crypto core. No I/O. */

/** Overwrites `bytes` with zeros (best effort: JS engines may keep copies). */
export function wipe(...arrays: (Uint8Array | null | undefined)[]): void {
  for (const a of arrays) a?.fill(0);
}

export function concatBytes(...arrays: Uint8Array[]): Uint8Array {
  const out = new Uint8Array(arrays.reduce((n, a) => n + a.length, 0));
  let offset = 0;
  for (const a of arrays) {
    out.set(a, offset);
    offset += a.length;
  }
  return out;
}

export const utf8 = (text: string): Uint8Array => new TextEncoder().encode(text);

/**
 * Cryptographically secure random bytes from `crypto.getRandomValues` (react-native-quick-crypto on device,
 * WebCrypto in browsers and Node). Throws instead of falling back to anything weaker.
 */
export function randomBytes(length: number): Uint8Array {
  const crypto = (globalThis as { crypto?: { getRandomValues?: <T extends ArrayBufferView>(a: T) => T } }).crypto;
  if (typeof crypto?.getRandomValues !== 'function') throw new Error('Secure random number generator unavailable');
  return crypto.getRandomValues(new Uint8Array(length));
}
