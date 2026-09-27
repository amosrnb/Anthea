import { mnemonicToEntropy } from '@scure/bip39';
import { wordlist } from '@scure/bip39/wordlists/english.js';
import { FAST_SCRYPT, nodeKdf } from '../../core/__tests__/nodeKdf';
import { createMemorySecureStore } from '../../platform/secureStore';
import { createKeyring, KeyringError, STORE_KEYS, type Signer } from '../keyring';

const ABOUT = 'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about';
const PIN = '246810';

async function setup() {
  const store = createMemorySecureStore();
  const keyring = createKeyring({ store, kdf: nodeKdf, scrypt: FAST_SCRYPT });
  const accounts = await keyring.create(mnemonicToEntropy(ABOUT, wordlist), PIN, 'mainnet');
  return { store, keyring, accounts };
}
const code = (p: Promise<unknown>) =>
  p.then(
    () => 'resolved',
    (e: KeyringError) => e.code,
  );

describe('create and unlock', () => {
  it('stores vault, device secret and public addresses, no plaintext', async () => {
    const { store, keyring, accounts } = await setup();
    expect(accounts.btc.receive[0]).toBe('bc1qcr8te4kr609gcawutmrza0j4xv80jy8z306fyu');
    expect(accounts.sol).toBe('HAgk14JpMQLgt6rVgv7cBQFJWFto5Dqxi472uT3DKpqk');
    const dump = store.dump();
    expect(Object.keys(dump).sort()).toEqual([STORE_KEYS.accounts, STORE_KEYS.deviceSecret, STORE_KEYS.vault].sort());
    expect(JSON.stringify(dump)).not.toMatch(/abandon|about/);
    expect(await keyring.hasWallet()).toBe(true);
  });

  it('unlocks with the PIN and returns only public data', async () => {
    const { keyring, accounts } = await setup();
    expect(await keyring.unlock(PIN)).toEqual(accounts);
  });

  it('rejects a wrong PIN', async () => {
    const { keyring } = await setup();
    expect(await code(keyring.unlock('000000'))).toBe('wrong-pin');
  });

  it('fails when the device secret is missing (e.g. vault copied to another device)', async () => {
    const { store, keyring } = await setup();
    await store.delete(STORE_KEYS.deviceSecret);
    expect(await code(keyring.unlock(PIN))).toBe('device-secret-missing');
  });

  it('fails when the vault ciphertext was manipulated', async () => {
    const { store, keyring } = await setup();
    const blob = JSON.parse((await store.get(STORE_KEYS.vault))!);
    blob.c = blob.c.slice(0, -4) + (blob.c.slice(-4) === 'AAAA' ? 'BBBB' : 'AAAA');
    await store.set(STORE_KEYS.vault, JSON.stringify(blob));
    expect(await code(keyring.unlock(PIN))).toBe('wrong-pin');
  });

  it('passes on unexpected vault errors unchanged', async () => {
    const { store, keyring } = await setup();
    await store.set(STORE_KEYS.vault, 'garbage');
    expect(await code(keyring.unlock(PIN))).toBe('corrupt');
  });

  it('refuses to overwrite an existing wallet', async () => {
    const { keyring } = await setup();
    expect(await code(keyring.create(new Uint8Array(16), PIN, 'mainnet'))).toBe('wallet-exists');
  });

  it('reports a missing wallet', async () => {
    const keyring = createKeyring({ store: createMemorySecureStore(), kdf: nodeKdf, scrypt: FAST_SCRYPT });
    expect(await keyring.hasWallet()).toBe(false);
    expect(await code(keyring.unlock(PIN))).toBe('no-wallet');
    expect(await code(keyring.withSigner(PIN, 'evm', 0, async () => 1))).toBe('no-wallet');
  });

  it('reports missing public data', async () => {
    const { store, keyring } = await setup();
    await store.delete(STORE_KEYS.accounts);
    expect(await code(keyring.unlock(PIN))).toBe('no-wallet');
  });
});

describe('withSigner', () => {
  it('hands out the requested key and wipes it afterwards', async () => {
    const { keyring, accounts } = await setup();
    let seen: Signer | undefined;
    const result = await keyring.withSigner(PIN, 'evm', 0, async (signer) => {
      seen = signer;
      expect(signer.address).toBe(accounts.evm);
      expect(signer.privateKey.some((b) => b !== 0)).toBe(true);
      return 'signed';
    });
    expect(result).toBe('signed');
    expect(seen!.privateKey.every((b) => b === 0)).toBe(true);
  });

  it('wipes the key even when the callback throws', async () => {
    const { keyring } = await setup();
    let seen: Signer | undefined;
    await expect(
      keyring.withSigner(PIN, 'sol', 0, async (signer) => {
        seen = signer;
        throw new Error('broadcast failed');
      }),
    ).rejects.toThrow('broadcast failed');
    expect(seen!.privateKey.every((b) => b === 0)).toBe(true);
  });

  it('derives Bitcoin change keys on request', async () => {
    const { keyring, accounts } = await setup();
    const address = await keyring.withSigner(PIN, 'btc', 0, async (s) => s.address, { chain: 'change' });
    expect(address).toBe(accounts.btc.change[0]);
  });

  it('requires the PIN', async () => {
    const { keyring } = await setup();
    const fn = jest.fn();
    expect(await code(keyring.withSigner('111111', 'evm', 0, fn))).toBe('wrong-pin');
    expect(fn).not.toHaveBeenCalled();
  });
});

describe('phrase, PIN change and reset', () => {
  it('reveals the phrase only with the PIN', async () => {
    const { keyring } = await setup();
    expect((await keyring.revealPhrase(PIN)).join(' ')).toBe(ABOUT);
    expect(await code(keyring.revealPhrase('999999'))).toBe('wrong-pin');
  });

  it('re-encrypts the vault for a new PIN and cleans up the temporary copy', async () => {
    const { store, keyring } = await setup();
    await keyring.changePin(PIN, '135790');
    expect(await code(keyring.unlock(PIN))).toBe('wrong-pin');
    expect((await keyring.unlock('135790')).evm).toBe('0x9858EfFD232B4033E47d90003D41EC34EcaEda94');
    expect(await store.get(STORE_KEYS.vaultNext)).toBeNull();
  });

  it('keeps the old vault when the old PIN is wrong', async () => {
    const { keyring } = await setup();
    expect(await code(keyring.changePin('000000', '135790'))).toBe('wrong-pin');
    expect(await keyring.unlock(PIN)).toBeTruthy();
  });

  it('keeps the old vault when writing the new one fails verification', async () => {
    const { store, keyring } = await setup();
    const original = store.get.bind(store);
    jest.spyOn(store, 'get').mockImplementation(async (key) => (key === STORE_KEYS.vaultNext ? 'garbage' : original(key)));
    await expect(keyring.changePin(PIN, '135790')).rejects.toBeTruthy();
    jest.restoreAllMocks();
    expect(await keyring.unlock(PIN)).toBeTruthy();
    expect(await store.get(STORE_KEYS.vaultNext)).toBeNull();
  });

  it('deletes everything on reset', async () => {
    const { store, keyring } = await setup();
    await keyring.reset();
    expect(store.dump()).toEqual({});
    expect(await keyring.hasWallet()).toBe(false);
  });
});
