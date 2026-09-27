/**
 * Backup check after showing a new phrase (BUILD_PLAN Phase 2.1): three random positions, each with the right word
 * and two random wrong words from the BIP39 list, in random order. No I/O.
 */
import { WORDLIST } from './mnemonic';
import { randomInt, secureShuffle } from './random';

export interface VerifyRow {
  /** 1-based position in the phrase. */
  pos: number;
  /** Three options in display order; exactly one is the word at `pos`. */
  opts: string[];
}

export function createVerifyChallenge(words: readonly string[], rand: (n: number) => number = randomInt, rows = 3): VerifyRow[] {
  const positions = secureShuffle(
    words.map((_, i) => i + 1),
    rand,
  )
    .slice(0, rows)
    .sort((a, b) => a - b);
  return positions.map((pos) => {
    const right = words[pos - 1]!;
    const wrong = new Set<string>();
    // Wrong words differ from every word of the phrase, so no option is "right" for another row by accident.
    while (wrong.size < 2) {
      const w = WORDLIST[rand(WORDLIST.length)]!;
      if (!words.includes(w)) wrong.add(w);
    }
    return { pos, opts: secureShuffle([right, ...wrong], rand) };
  });
}

/** Fresh random order of the same options (each time the step opens again). */
export const reshuffle = (rows: readonly VerifyRow[], rand: (n: number) => number = randomInt): VerifyRow[] =>
  rows.map((r) => ({ pos: r.pos, opts: secureShuffle(r.opts, rand) }));
