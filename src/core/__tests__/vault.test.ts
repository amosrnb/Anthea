import { base64 } from '@scure/base';
import { scryptAsync } from '@noble/hashes/scrypt.js';
import { randomBytes } from '../bytes';
import { DEFAULT_SCRYPT, decryptVault, encryptVault, isValidPin, vaultParams, VaultError } from '../vault';
import { FAST_SCRYPT, nodeKdf } from './nodeKdf';

const entropy = Uint8Array.from({ length: 16 }, (_, i) => i + 1);
const secret = randomBytes(32);
const PIN = '482915';

const encrypt = (e: Uint8Array = entropy, pin = PIN, s = secret) => encryptVault(e, pin, s, nodeKdf, FAST_SCRYPT);
const code = (p: Promise<unknown>) =>
  p.then(
    () => 'resolved',
    (e: VaultError) => e.code,
  );

/** Flips one bit in the base64 field `field` of the serialized vault. */
function tamper(serialized: string, field: 'c' | 'salt' | 'nonce'): string {
  const blob = JSON.parse(serialized);
  if (field === 'c') {
    const c = base64.decode(blob.c);
    c[0]! ^= 1;
    blob.c = base64.encode(c);
  } else {
    const h = JSON.parse(blob.h);
    const b = base64.decode(h[field]);
    b[0]! ^= 1;
    h[field] = base64.encode(b);
    blob.h = JSON.stringify(h);
  }
  return JSON.stringify(blob);
}

describe('vault roundtrip', () => {
  it('decrypts 16- and 32-byte entropy with the right PIN and device secret', async () => {
    expect(await decryptVault(await encrypt(), PIN, secret, nodeKdf)).toEqual(entropy);
    const e32 = randomBytes(32);
    expect(await decryptVault(await encrypt(e32), PIN, secret, nodeKdf)).toEqual(e32);
  });

  it('uses a fresh salt and nonce every time', async () => {
    const [a, b] = [JSON.parse(JSON.parse(await encrypt()).h), JSON.parse(JSON.parse(await encrypt()).h)];
    expect(a.salt).not.toBe(b.salt);
    expect(a.nonce).not.toBe(b.nonce);
  });

  it('stores version and KDF parameters in the header, never the plaintext', async () => {
    const serialized = await encrypt();
    const header = JSON.parse(JSON.parse(serialized).h);
    expect(header).toMatchObject({ v: 1, kdf: 'scrypt', ...FAST_SCRYPT });
    expect(vaultParams(serialized)).toEqual(FAST_SCRYPT);
    expect(serialized).not.toContain(base64.encode(entropy));
  });

  it('matches the pure-JS scrypt (web fallback) with the production parameters', async () => {
    const params = DEFAULT_SCRYPT;
    const salt = randomBytes(16);
    const pw = new TextEncoder().encode(PIN);
    expect(await nodeKdf(pw, salt, params)).toEqual(
      await scryptAsync(pw as Uint8Array<ArrayBuffer>, salt as Uint8Array<ArrayBuffer>, { ...params, dkLen: 32 }),
    );
  }, 60000);

  it('defaults to N=2^17, r=8, p=1', async () => {
    const serialized = await encryptVault(entropy, PIN, secret, nodeKdf);
    expect(vaultParams(serialized)).toEqual({ N: 2 ** 17, r: 8, p: 1 });
    expect(await decryptVault(serialized, PIN, secret, nodeKdf)).toEqual(entropy);
  }, 60000);
});

describe('vault failures', () => {
  it('fails with a wrong PIN', async () => {
    expect(await code(decryptVault(await encrypt(), '482916', secret, nodeKdf))).toBe('decrypt-failed');
  });

  it('fails without the right device secret', async () => {
    expect(await code(decryptVault(await encrypt(), PIN, randomBytes(32), nodeKdf))).toBe('decrypt-failed');
    expect(await code(decryptVault(await encrypt(), PIN, new Uint8Array(0), nodeKdf))).toBe('decrypt-failed');
  });

  it.each(['c', 'salt', 'nonce'] as const)('fails when %s is tampered with', async (field) => {
    expect(await code(decryptVault(tamper(await encrypt(), field), PIN, secret, nodeKdf))).toBe('decrypt-failed');
  });

  it('fails when the authenticated header is changed (e.g. weaker KDF parameters)', async () => {
    const blob = JSON.parse(await encrypt());
    blob.h = JSON.stringify({ ...JSON.parse(blob.h), N: 2 ** 11 });
    expect(await code(decryptVault(JSON.stringify(blob), PIN, secret, nodeKdf))).toBe('decrypt-failed');
  });

  it.each([
    ['not json', 'corrupt'],
    [JSON.stringify({ h: '{', c: '' }), 'corrupt'],
    [JSON.stringify({ h: JSON.stringify({ v: 2, kdf: 'scrypt' }), c: '' }), 'unsupported-version'],
    [JSON.stringify({ h: JSON.stringify({ v: 1, kdf: 'argon2' }), c: '' }), 'unsupported-version'],
    [JSON.stringify({ h: JSON.stringify({ v: 1, kdf: 'scrypt', N: 3, r: 8, p: 1 }), c: '' }), 'corrupt'],
    [JSON.stringify({ h: JSON.stringify({ v: 1, kdf: 'scrypt', N: 2 ** 30, r: 8, p: 1 }), c: '' }), 'corrupt'],
    [JSON.stringify({ h: JSON.stringify({ v: 1, kdf: 'scrypt', N: 1024, r: 8, p: 1, salt: '!', nonce: 'AA' }), c: '' }), 'corrupt'],
    [JSON.stringify({ h: JSON.stringify({ v: 1, kdf: 'scrypt', N: 1024, r: 8, p: 1 }), c: '!!!' }), 'corrupt'],
  ])('rejects malformed input %#', async (serialized, expected) => {
    expect(await code(decryptVault(serialized, PIN, secret, nodeKdf))).toBe(expected);
  });

  it('only accepts 6-digit PINs and 16/32-byte entropy', async () => {
    expect(isValidPin('123456')).toBe(true);
    for (const pin of ['12345', '1234567', '12345a', ' 123456']) expect(isValidPin(pin)).toBe(false);
    expect(await code(encrypt(entropy, '12345'))).toBe('invalid-pin-format');
    expect(await code(encrypt(new Uint8Array(20)))).toBe('invalid-entropy');
    expect(await code(decryptVault(await encrypt(), 'abcdef', secret, nodeKdf))).toBe('invalid-pin-format');
  });

  it('never puts secrets into error messages', async () => {
    const e = await decryptVault(await encrypt(), '000000', secret, nodeKdf).catch((x: Error) => x);
    expect(String((e as Error).message)).toBe('Vault error: decrypt-failed');
  });
});
