import { attemptsLeft, formatWait, lockRemaining, NO_ATTEMPTS, parseAttempts, registerFailure, waitAfter } from '../pinPolicy';

const MIN = 60_000;

describe('PIN attempt policy (BUILD_PLAN 5.3)', () => {
  it('allows 5 free attempts, then waits 1, 5, 15, 60, 60 … minutes', () => {
    expect([1, 2, 3, 4].map(waitAfter)).toEqual([0, 0, 0, 0]);
    expect([5, 6, 7, 8, 9, 20].map(waitAfter)).toEqual([1, 5, 15, 60, 60, 60].map((m) => m * MIN));
  });

  it('counts failures and sets the wait from the time of the failure', () => {
    let s = NO_ATTEMPTS;
    for (let i = 0; i < 4; i++) s = registerFailure(s, 1000);
    expect(s).toEqual({ failures: 4, lockedUntil: 0 });
    expect(attemptsLeft(s)).toBe(1);
    s = registerFailure(s, 1000);
    expect(s).toEqual({ failures: 5, lockedUntil: 1000 + MIN });
    expect(attemptsLeft(s)).toBe(0);
    expect(lockRemaining(s, 1000 + 30_000)).toBe(30_000);
    expect(lockRemaining(s, 1000 + 2 * MIN)).toBe(0);
  });

  it('formats the countdown as MM:SS, never showing 00:00 while locked', () => {
    expect(formatWait(60 * MIN)).toBe('60:00');
    expect(formatWait(61_000)).toBe('01:01');
    expect(formatWait(1)).toBe('00:01');
  });

  it('reads stored values defensively', () => {
    expect(parseAttempts(null)).toEqual(NO_ATTEMPTS);
    expect(parseAttempts(JSON.stringify({ failures: 3, lockedUntil: 42 }))).toEqual({ failures: 3, lockedUntil: 42 });
    expect(parseAttempts(JSON.stringify({ failures: -1, lockedUntil: 'x' }))).toEqual(NO_ATTEMPTS);
    // Corrupted data never unlocks: treated as many failures, so the next wrong PIN waits an hour.
    const broken = parseAttempts('{');
    expect(waitAfter(broken.failures + 1)).toBe(60 * MIN);
  });
});
