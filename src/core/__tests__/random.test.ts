import { randomInt, secureShuffle } from '../random';
import { createVerifyChallenge, reshuffle } from '../verify';
import { WORDLIST } from '../mnemonic';

describe('randomInt', () => {
  it('stays in range and covers all values', () => {
    const seen = new Set<number>();
    for (let i = 0; i < 2000; i++) {
      const v = randomInt(7);
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(7);
      seen.add(v);
    }
    expect(seen.size).toBe(7);
    expect(randomInt(1)).toBe(0);
  });

  it('rejects invalid ranges', () => {
    for (const n of [0, -1, 1.5, 2 ** 33]) expect(() => randomInt(n)).toThrow(RangeError);
  });

  it('retries values above the rejection limit', () => {
    const original = globalThis.crypto.getRandomValues.bind(globalThis.crypto);
    let calls = 0;
    jest.spyOn(globalThis.crypto, 'getRandomValues').mockImplementation(<T extends ArrayBufferView | null>(a: T): T => {
      calls++;
      const bytes = a as unknown as Uint8Array<ArrayBuffer>;
      if (calls === 1)
        bytes.fill(0xff); // 2^32 - 1 is above the limit for n = 3
      else original(bytes);
      return a;
    });
    expect(randomInt(3)).toBeLessThan(3);
    expect(calls).toBeGreaterThan(1);
    jest.restoreAllMocks();
  });
});

describe('secureShuffle', () => {
  it('returns a permutation', () => {
    const items = [1, 2, 3, 4, 5];
    const out = secureShuffle(items);
    expect(out.slice().sort()).toEqual(items);
    expect(secureShuffle(items, () => 0)).toEqual([2, 3, 4, 5, 1]);
  });
});

describe('createVerifyChallenge', () => {
  const words = 'abandon ability able about above absent absorb abstract absurd abuse access accident'.split(' ');

  it('picks 3 sorted positions, each with the right word and 2 wrong ones from the list', () => {
    for (let k = 0; k < 50; k++) {
      const rows = createVerifyChallenge(words);
      expect(rows).toHaveLength(3);
      expect(new Set(rows.map((r) => r.pos)).size).toBe(3);
      expect(rows.map((r) => r.pos)).toEqual(rows.map((r) => r.pos).sort((a, b) => a - b));
      for (const r of rows) {
        expect(r.opts).toHaveLength(3);
        expect(r.opts.filter((o) => o === words[r.pos - 1])).toHaveLength(1);
        for (const o of r.opts.filter((x) => x !== words[r.pos - 1])) {
          expect(WORDLIST).toContain(o);
          expect(words).not.toContain(o);
        }
      }
    }
  });

  it('reshuffles only the order', () => {
    const rows = createVerifyChallenge(words);
    const again = reshuffle(rows);
    again.forEach((r, i) => {
      expect(r.pos).toBe(rows[i]!.pos);
      expect(r.opts.slice().sort()).toEqual(rows[i]!.opts.slice().sort());
    });
  });
});
