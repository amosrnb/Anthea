import { scrypt } from 'node:crypto';
import type { Kdf } from '../vault';

/** scrypt from Node for tests (same algorithm as react-native-quick-crypto on devices). */
export const nodeKdf: Kdf = (password, salt, { N, r, p }) =>
  new Promise((resolve, reject) =>
    scrypt(password, salt, 32, { N, r, p, maxmem: 256 * r * N }, (err, key) => (err ? reject(err) : resolve(new Uint8Array(key)))),
  );

/** Fast parameters for tests that do not measure the KDF itself. */
export const FAST_SCRYPT = { N: 2 ** 10, r: 8, p: 1 };
