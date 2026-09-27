import { mnemonicToEntropy } from '@scure/bip39';
import { wordlist } from '@scure/bip39/wordlists/english.js';
import { scanBitcoin, scanChain } from '../btcScan';
import { btcAddressFromXpub, derivePublic, seedFromEntropy } from '../derive';

const ABOUT = 'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about';

async function accounts(network: 'mainnet' | 'testnet' = 'mainnet') {
  return derivePublic(await seedFromEntropy(mnemonicToEntropy(ABOUT, wordlist)), network);
}

describe('xpub derivation', () => {
  it('matches the private derivation (BIP84 vectors)', async () => {
    const a = await accounts();
    expect(btcAddressFromXpub(a.btc.xpub, 'mainnet', 'receive', 0)).toBe('bc1qcr8te4kr609gcawutmrza0j4xv80jy8z306fyu');
    expect(btcAddressFromXpub(a.btc.xpub, 'mainnet', 'receive', 1)).toBe('bc1qnjg0jd8228aq7egyzacy8cys3knf9xvrerkf9g');
    expect(btcAddressFromXpub(a.btc.xpub, 'mainnet', 'change', 0)).toBe('bc1q8c6fshw2dlwun7ekn9qwf37cu2rn755upcp6el');
    // BIP84 account xpub for this phrase (zpub…6RDM in SLIP-132 encoding, same key).
    expect(a.btc.xpub).toBe('xpub6CatWdiZiodmUeTDp8LT5or8nmbKNcuyvz7WyksVFkKB4RHwCD3XyuvPEbvqAQY3rAPshWcMLoP2fMFMKHPJ4ZeZXYVUhLv1VMrjPC7PW6V');
  });
});

describe('gap-limit scan', () => {
  it('stops after 20 unused addresses when nothing is used', async () => {
    const isUsed = jest.fn(async () => false);
    const a = await accounts();
    expect(await scanChain(a.btc.xpub, 'mainnet', 'receive', isUsed)).toBe(0);
    expect(isUsed).toHaveBeenCalledTimes(20);
  });

  it('continues past gaps shorter than the limit', async () => {
    const a = await accounts();
    const used = new Set([0, 3, 22].map((i) => btcAddressFromXpub(a.btc.xpub, 'mainnet', 'receive', i)));
    const isUsed = jest.fn(async (addr: string) => used.has(addr));
    expect(await scanChain(a.btc.xpub, 'mainnet', 'receive', isUsed)).toBe(23);
    expect(isUsed).toHaveBeenCalledTimes(43);
  });

  it('returns all known addresses plus the next unused one per chain', async () => {
    const a = await accounts('testnet');
    const used = new Set([btcAddressFromXpub(a.btc.xpub, 'testnet', 'receive', 1), btcAddressFromXpub(a.btc.xpub, 'testnet', 'change', 0)]);
    const scanned = await scanBitcoin(a, async (addr) => used.has(addr));
    expect(scanned.btc.receive).toHaveLength(3);
    expect(scanned.btc.change).toHaveLength(2);
    expect(scanned.btc.receive[0]).toBe(a.btc.receive[0]);
    expect(scanned.btc.receive.every((x) => x.startsWith('tb1q'))).toBe(true);
  });

  it('propagates lookup errors', async () => {
    const a = await accounts();
    await expect(scanBitcoin(a, async () => Promise.reject(new Error('offline')))).rejects.toThrow('offline');
  });
});
