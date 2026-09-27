import { hexToBytes, bytesToHex } from '@noble/hashes/utils.js';
import { HDKey } from '@scure/bip32';
import { mnemonicToSeedSync } from '@scure/bip39';
import vectors from './fixtures/bip39-trezor.json';
import { checkMnemonic, generateEntropy, isWord, splitWords, suggestWords, toMnemonic, WORDLIST } from '../mnemonic';

describe('BIP39 reference vectors (Trezor)', () => {
  it.each(vectors.vectors.map((v) => [v.mnemonic.split(' ').length, v] as const))('%i words: entropy ↔ mnemonic, seed, root key', (_n, v) => {
    expect(toMnemonic(hexToBytes(v.entropy))).toBe(v.mnemonic);
    const check = checkMnemonic(v.mnemonic);
    // Import accepts 12 and 24 words only (BUILD_PLAN 1.1); 18-word vectors count as incomplete.
    if (_n === 18) expect(check).toEqual({ kind: 'incomplete', count: 18 });
    else expect(check.kind === 'ok' && bytesToHex(check.entropy)).toBe(v.entropy);
    const seed = mnemonicToSeedSync(v.mnemonic, 'TREZOR');
    expect(bytesToHex(seed)).toBe(v.seed);
    expect(HDKey.fromMasterSeed(seed).privateExtendedKey).toBe(v.xprv);
  });
});

describe('generation', () => {
  it('creates 12-word phrases from 128 bits of fresh entropy', () => {
    const entropy = generateEntropy();
    expect(entropy).toHaveLength(16);
    const words = toMnemonic(entropy).split(' ');
    expect(words).toHaveLength(12);
    expect(words.every(isWord)).toBe(true);
    expect(generateEntropy()).not.toEqual(entropy);
  });
});

describe('checkMnemonic', () => {
  const valid12 = 'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about';

  it('normalizes case, whitespace and Unicode (NFKD)', () => {
    expect(splitWords('  Abandon\tABOUT\n')).toEqual(['abandon', 'about']);
    expect(checkMnemonic(valid12.toUpperCase().replace(/ /g, '  \n')).kind).toBe('ok');
  });

  it('reports empty and incomplete input', () => {
    expect(checkMnemonic('   ')).toEqual({ kind: 'empty' });
    expect(checkMnemonic('abandon abandon ')).toEqual({ kind: 'incomplete', count: 2 });
  });

  it('does not judge the word still being typed', () => {
    expect(checkMnemonic('abandon ab')).toEqual({ kind: 'incomplete', count: 2 });
    expect(checkMnemonic('abandon ab ')).toEqual({ kind: 'invalid-word', word: 'ab', index: 1 });
  });

  it('judges the last word once the phrase has a valid length', () => {
    expect(checkMnemonic(valid12.replace(/about$/, 'abou'))).toEqual({ kind: 'invalid-word', word: 'abou', index: 11 });
  });

  it('rejects unknown words', () => {
    expect(checkMnemonic('abandon xyz abandon')).toEqual({ kind: 'invalid-word', word: 'xyz', index: 1 });
  });

  it('distinguishes a wrong checksum from unknown words', () => {
    expect(checkMnemonic(valid12.replace(/about$/, 'abandon'))).toEqual({ kind: 'bad-checksum' });
  });

  it('rejects phrases longer than 24 words', () => {
    expect(checkMnemonic(Array(25).fill('abandon').join(' '))).toEqual({ kind: 'bad-length', count: 25 });
  });

  it('accepts 24 words', () => {
    const v = vectors.vectors.find((x) => x.mnemonic.split(' ').length === 24)!;
    expect(checkMnemonic(v.mnemonic).kind).toBe('ok');
  });
});

describe('suggestWords', () => {
  it('suggests from the full 2048-word list', () => {
    expect(WORDLIST).toHaveLength(2048);
    expect(suggestWords('har')).toEqual(['harbor', 'hard', 'harsh', 'harvest']);
    expect(suggestWords('zoo')).toEqual([]);
    expect(suggestWords('ab', 3)).toEqual(['abandon', 'ability', 'able']);
    expect(suggestWords('  ')).toEqual([]);
  });
});
