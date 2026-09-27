import { concatBytes, randomBytes, utf8, wipe } from '../bytes';

describe('bytes', () => {
  it('wipes arrays in place and ignores missing ones', () => {
    const a = new Uint8Array([1, 2, 3]);
    wipe(a, undefined, null);
    expect([...a]).toEqual([0, 0, 0]);
  });

  it('concatenates and encodes UTF-8', () => {
    expect([...concatBytes(new Uint8Array([1]), new Uint8Array([2, 3]))]).toEqual([1, 2, 3]);
    expect([...utf8('ä')]).toEqual([0xc3, 0xa4]);
  });

  it('draws random bytes from crypto.getRandomValues', () => {
    const a = randomBytes(32);
    expect(a).toHaveLength(32);
    expect(randomBytes(32)).not.toEqual(a);
  });

  it('refuses to run without a secure RNG', () => {
    const original = globalThis.crypto;
    Object.defineProperty(globalThis, 'crypto', { value: undefined, configurable: true });
    try {
      expect(() => randomBytes(8)).toThrow('Secure random number generator unavailable');
    } finally {
      Object.defineProperty(globalThis, 'crypto', { value: original, configurable: true });
    }
  });
});
