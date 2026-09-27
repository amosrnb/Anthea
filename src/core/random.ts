/** Uniform random integers from the secure RNG (never Math.random, BUILD_PLAN 2.6). No I/O. */
import { randomBytes } from './bytes';

/** Uniform integer in [0, n) via rejection sampling on 32-bit values. */
export function randomInt(n: number): number {
  if (!Number.isInteger(n) || n < 1 || n > 2 ** 32) throw new RangeError('n out of range');
  const limit = 2 ** 32 - (2 ** 32 % n);
  for (;;) {
    const b = randomBytes(4);
    const v = ((b[0]! << 24) | (b[1]! << 16) | (b[2]! << 8) | b[3]!) >>> 0;
    if (v < limit) return v % n;
  }
}

/** Fisher–Yates shuffle with the secure RNG into a new array. */
export function secureShuffle<T>(items: readonly T[], rand: (n: number) => number = randomInt): T[] {
  const out = items.slice();
  for (let i = out.length - 1; i > 0; i--) {
    const j = rand(i + 1);
    [out[i], out[j]] = [out[j]!, out[i]!];
  }
  return out;
}
