import { Platform } from 'react-native';
import { installCrypto, scryptKdf } from '../crypto';

const mockInstall = jest.fn();
const mockScrypt = jest.fn();
jest.mock('react-native-quick-crypto', () => ({ install: () => mockInstall(), scrypt: (...args: unknown[]) => mockScrypt(...args) }));
const install = mockInstall;
const scrypt = mockScrypt;

const params = { N: 2 ** 10, r: 8, p: 1 };

describe('native (react-native-quick-crypto)', () => {
  it('installs the native crypto global', () => {
    installCrypto();
    expect(install).toHaveBeenCalledTimes(1);
  });

  it('runs scrypt natively with enough memory for the parameters', async () => {
    scrypt.mockImplementation((_pw, _salt, _len, _opts, cb) => cb(null, new Uint8Array([1, 2, 3])));
    expect(await scryptKdf(new Uint8Array(1), new Uint8Array(16), params)).toEqual(new Uint8Array([1, 2, 3]));
    expect(scrypt.mock.calls[0]![2]).toBe(32);
    expect(scrypt.mock.calls[0]![3]).toEqual({ ...params, maxmem: 256 * 8 * 2 ** 10 });
  });

  it('propagates native errors', async () => {
    scrypt.mockImplementation((_pw, _salt, _len, _opts, cb) => cb(new Error('oom')));
    await expect(scryptKdf(new Uint8Array(1), new Uint8Array(16), params)).rejects.toThrow('oom');
  });
});

describe('web preview', () => {
  const os = Platform.OS;
  beforeAll(() => Object.defineProperty(Platform, 'OS', { value: 'web', configurable: true }));
  afterAll(() => Object.defineProperty(Platform, 'OS', { value: os, configurable: true }));

  it('uses the browser RNG and pure-JS scrypt', async () => {
    install.mockClear();
    installCrypto();
    expect(install).not.toHaveBeenCalled();
    expect(await scryptKdf(new TextEncoder().encode('123456'), new Uint8Array(16), params)).toHaveLength(32);
  });
});
