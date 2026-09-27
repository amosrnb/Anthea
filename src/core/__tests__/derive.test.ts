import { secp256k1 } from '@noble/curves/secp256k1.js';
import { ed25519 } from '@noble/curves/ed25519.js';
import { mnemonicToEntropy } from '@scure/bip39';
import { wordlist } from '@scure/bip39/wordlists/english.js';
import { deriveKey, derivePublic, paths, seedFromEntropy } from '../derive';

const ABOUT = 'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about';
const JUNK = 'test test test test test test test test test test test junk';
const seedOf = (m: string) => seedFromEntropy(mnemonicToEntropy(m, wordlist));

describe('mandatory test vectors (BUILD_PLAN 5.1)', () => {
  it('EVM: "test … junk" → 0xf39F…2266 (Hardhat/Anvil account #0)', async () => {
    const seed = await seedOf(JUNK);
    expect(derivePublic(seed, 'mainnet').evm).toBe('0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266');
    expect(deriveKey(seed, 'evm', 'mainnet', 1).address).toBe('0x70997970C51812dc3A010C7d01b50e0d17dc79C8'); // account #1
  });

  it('Bitcoin: "abandon … about" → BIP84 vectors (receive 0/1, change 0)', async () => {
    // https://github.com/bitcoin/bips/blob/master/bip-0084.mediawiki#test-vectors
    const seed = await seedOf(ABOUT);
    const pub = derivePublic(seed, 'mainnet', { receive: 2, change: 1 });
    expect(pub.btc.receive).toEqual(['bc1qcr8te4kr609gcawutmrza0j4xv80jy8z306fyu', 'bc1qnjg0jd8228aq7egyzacy8cys3knf9xvrerkf9g']);
    expect(pub.btc.change).toEqual(['bc1q8c6fshw2dlwun7ekn9qwf37cu2rn755upcp6el']);
  });

  it("Solana: \"abandon … about\" → HAgk…Kpqk at m/44'/501'/0'/0'", async () => {
    // Cross-checked with an independent implementation (ed25519-hd-key + tweetnacl with the same path). Import into
    // Phantom/Solflare is verified manually before v1 (BUILD_PLAN 10).
    const seed = await seedOf(ABOUT);
    expect(derivePublic(seed, 'mainnet').sol).toBe('HAgk14JpMQLgt6rVgv7cBQFJWFto5Dqxi472uT3DKpqk');
    expect(derivePublic(await seedOf(JUNK), 'mainnet').sol).toBe('oeYf6KAJkLYhBuR8CiGc6L4D4Xtfepr85fuDgA9kq96');
  });

  it("testnet: coin type 1' and tb1 for Bitcoin, same EVM and Solana addresses", async () => {
    const seed = await seedOf(ABOUT);
    const main = derivePublic(seed, 'mainnet');
    const test = derivePublic(seed, 'testnet');
    // BIP84 with coin type 1': the widely published first testnet receive address for this phrase.
    expect(test.btc.receive[0]).toBe('tb1q6rz28mcfaxtmd6v789l9rrlrusdprr9pqcpvkl');
    expect(test.evm).toBe(main.evm);
    expect(test.sol).toBe(main.sol);
    expect(test.network).toBe('testnet');
  });
});

describe('deriveKey', () => {
  it('returns keys that match the address and can sign', async () => {
    const seed = await seedOf(JUNK);
    const msg = new Uint8Array(32).fill(7);

    const evm = deriveKey(seed, 'evm', 'mainnet', 0);
    expect(evm.path).toBe(paths.evm(0));
    expect(secp256k1.verify(secp256k1.sign(msg, evm.privateKey, { prehash: false }), msg, evm.publicKey, { prehash: false })).toBe(true);

    const sol = deriveKey(seed, 'sol', 'mainnet', 0);
    expect(sol.publicKey).toEqual(ed25519.getPublicKey(sol.privateKey));

    const change = deriveKey(seed, 'btc', 'testnet', 3, 'change');
    expect(change.path).toBe("m/84'/1'/0'/1/3");
    expect(change.address.startsWith('tb1q')).toBe(true);
  });

  it('returns a copy of the private key that can be wiped independently', async () => {
    const seed = await seedOf(JUNK);
    const a = deriveKey(seed, 'evm', 'mainnet', 0);
    a.privateKey.fill(0);
    expect(deriveKey(seed, 'evm', 'mainnet', 0).privateKey.some((b) => b !== 0)).toBe(true);
  });
});
