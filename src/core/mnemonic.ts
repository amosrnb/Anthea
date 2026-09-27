/**
 * BIP39 mnemonics (BUILD_PLAN 5.1): 12 words (128-bit entropy) for new wallets; 12 or 24 words on import; English
 * word list only; no BIP39 passphrase in v1. No I/O.
 */
import { entropyToMnemonic, mnemonicToEntropy } from '@scure/bip39';
import { wordlist } from '@scure/bip39/wordlists/english.js';
import { randomBytes } from './bytes';

export const WORDLIST: readonly string[] = wordlist;
const WORDS = new Set(wordlist);

/** Word counts accepted on import. */
export const IMPORT_WORD_COUNTS = [12, 24] as const;

/** 16 bytes of fresh entropy for a new 12-word wallet. */
export const generateEntropy = (): Uint8Array => randomBytes(16);

export const toMnemonic = (entropy: Uint8Array): string => entropyToMnemonic(entropy, wordlist);

/** Splits user input into normalized words: Unicode NFKD, lower case, any whitespace as separator. */
export const splitWords = (input: string): string[] => input.normalize('NFKD').toLowerCase().trim().split(/\s+/).filter(Boolean);

export const isWord = (word: string): boolean => WORDS.has(word);

export type MnemonicCheck =
  | { kind: 'empty' }
  /** Fewer words than a valid phrase, all known so far. */
  | { kind: 'incomplete'; count: number }
  | { kind: 'invalid-word'; word: string; index: number }
  /** All words known, but 12 < count < 24 or count > 24. */
  | { kind: 'bad-length'; count: number }
  | { kind: 'bad-checksum' }
  | { kind: 'ok'; entropy: Uint8Array };

/**
 * Validates an import phrase. The last word is only judged once it is complete (followed by whitespace) or the
 * phrase has a valid length, so the UI can suggest words while typing.
 */
export function checkMnemonic(input: string): MnemonicCheck {
  const words = splitWords(input);
  if (words.length === 0) return { kind: 'empty' };
  const typing = !/\s$/.test(input) && !(IMPORT_WORD_COUNTS as readonly number[]).includes(words.length);
  const complete = typing ? words.slice(0, -1) : words;
  const badIndex = complete.findIndex((w) => !isWord(w));
  if (badIndex >= 0) return { kind: 'invalid-word', word: complete[badIndex]!, index: badIndex };
  if (!(IMPORT_WORD_COUNTS as readonly number[]).includes(words.length)) {
    return words.length < 24 ? { kind: 'incomplete', count: words.length } : { kind: 'bad-length', count: words.length };
  }
  try {
    return { kind: 'ok', entropy: mnemonicToEntropy(words.join(' '), wordlist) };
  } catch {
    return { kind: 'bad-checksum' };
  }
}

/** Up to `limit` words from the full BIP39 list that start with `prefix` (excluding an exact match). */
export function suggestWords(prefix: string, limit = 5): string[] {
  const p = prefix.normalize('NFKD').toLowerCase().trim();
  if (!p) return [];
  const out: string[] = [];
  for (const w of wordlist) {
    if (w.startsWith(p) && w !== p) out.push(w);
    if (out.length === limit) break;
  }
  return out;
}
