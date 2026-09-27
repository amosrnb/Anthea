import { mnemonicToEntropy } from '@scure/bip39';
import { wordlist } from '@scure/bip39/wordlists/english.js';
import { FAST_SCRYPT, nodeKdf } from '../../core/__tests__/nodeKdf';
import { createMemorySecureStore } from '../../platform/secureStore';
import { createKeyring, STORE_KEYS } from '../keyring';
import { createSession } from '../session';

const ABOUT = 'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about';
const PIN = '112233';
const MIN = 60_000;

async function setup() {
  const store = createMemorySecureStore();
  const keyring = createKeyring({ store, kdf: nodeKdf, scrypt: FAST_SCRYPT });
  const clock = { t: 1_000_000 };
  const session = createSession({ keyring, store, now: () => clock.t });
  await session.create(mnemonicToEntropy(ABOUT, wordlist), PIN, 'testnet');
  return { store, session, clock };
}

describe('session PIN guard', () => {
  it('unlocks with the right PIN', async () => {
    const { session } = await setup();
    const r = await session.unlock(PIN);
    expect(r.ok && r.value.evm).toBe('0x9858EfFD232B4033E47d90003D41EC34EcaEda94');
  });

  it('applies the same counter to every PIN entry and waits after the fifth failure', async () => {
    const { session, clock } = await setup();
    expect(await session.unlock('000000')).toEqual({ ok: false, reason: 'wrong-pin', left: 4, lockedFor: 0 });
    expect(await session.verifyPin('000000')).toMatchObject({ left: 3 });
    expect(await session.revealPhrase('000000')).toMatchObject({ left: 2 });
    expect(await session.changePin('000000', '111111')).toMatchObject({ left: 1 });
    expect(await session.withSigner('000000', 'evm', 0, async () => 1)).toEqual({ ok: false, reason: 'wrong-pin', left: 0, lockedFor: MIN });

    // Even the right PIN is not checked during the wait.
    expect(await session.unlock(PIN)).toEqual({ ok: false, reason: 'locked', lockedFor: MIN });
    clock.t += 30_000;
    expect(await session.lockedFor()).toBe(30_000);
    clock.t += 30_000;
    expect((await session.unlock(PIN)).ok).toBe(true);
    expect(await session.lockedFor()).toBe(0);
  });

  it('increases the wait for further failures', async () => {
    const { session, store, clock } = await setup();
    await store.set(STORE_KEYS.pinAttempts, JSON.stringify({ failures: 5, lockedUntil: 0 }));
    expect(await session.unlock('000000')).toMatchObject({ lockedFor: 5 * MIN });
    clock.t += 5 * MIN;
    expect(await session.unlock('000000')).toMatchObject({ lockedFor: 15 * MIN });
  });

  it('signs through the guard', async () => {
    const { session } = await setup();
    const r = await session.withSigner<string>(PIN, 'btc', 0, async (s) => s.address);
    expect(r.ok && r.value.startsWith('tb1q')).toBe(true);
  });

  it('passes unexpected errors through', async () => {
    const { session, store } = await setup();
    await store.delete(STORE_KEYS.deviceSecret);
    await expect(session.unlock(PIN)).rejects.toMatchObject({ code: 'device-secret-missing' });
  });

  it('resets everything including the counter', async () => {
    const { session, store } = await setup();
    await session.unlock('000000');
    await session.reset();
    expect(store.dump()).toEqual({});
    expect(await session.hasWallet()).toBe(false);
  });
});
