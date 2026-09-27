/**
 * PIN attempt policy (BUILD_PLAN 5.3): after 5 failures, increasing waits of 1 min, 5 min, 15 min, 1 h, then 1 h
 * for each further failure. Nothing is ever deleted automatically. Pure logic; persisted by state/pinGuard.ts.
 */

export const FREE_ATTEMPTS = 5;
const WAITS_MS = [1, 5, 15, 60].map((m) => m * 60_000);

export interface PinAttempts {
  /** Consecutive wrong PINs since the last correct one. */
  failures: number;
  /** Epoch ms until which no PIN may be entered (0 = not locked). */
  lockedUntil: number;
}

export const NO_ATTEMPTS: PinAttempts = { failures: 0, lockedUntil: 0 };

/** Wait after the n-th consecutive failure (0 for the first four). */
export function waitAfter(failures: number): number {
  if (failures < FREE_ATTEMPTS) return 0;
  return WAITS_MS[Math.min(failures - FREE_ATTEMPTS, WAITS_MS.length - 1)]!;
}

export function registerFailure(state: PinAttempts, now: number): PinAttempts {
  const failures = state.failures + 1;
  const wait = waitAfter(failures);
  return { failures, lockedUntil: wait ? now + wait : 0 };
}

/** Milliseconds until the next attempt is allowed (0 = now). */
export const lockRemaining = (state: PinAttempts, now: number): number => Math.max(0, state.lockedUntil - now);

/** Attempts left before the first wait (never below 0). */
export const attemptsLeft = (state: PinAttempts): number => Math.max(0, FREE_ATTEMPTS - state.failures);

/** "MM:SS", rounded up so the display never shows 00:00 while still locked. */
export function formatWait(ms: number): string {
  const s = Math.ceil(ms / 1000);
  return String(Math.floor(s / 60)).padStart(2, '0') + ':' + String(s % 60).padStart(2, '0');
}

export function parseAttempts(stored: string | null): PinAttempts {
  if (!stored) return NO_ATTEMPTS;
  try {
    const v = JSON.parse(stored) as Partial<PinAttempts>;
    const failures = Number.isSafeInteger(v.failures) && v.failures! >= 0 ? v.failures! : 0;
    const lockedUntil = Number.isFinite(v.lockedUntil) && v.lockedUntil! >= 0 ? v.lockedUntil! : 0;
    return { failures, lockedUntil };
  } catch {
    // A corrupted counter must not unlock anything: treat it as the strictest state.
    return { failures: FREE_ATTEMPTS + WAITS_MS.length, lockedUntil: 0 };
  }
}
