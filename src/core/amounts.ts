/**
 * On-chain amounts as bigint base units (BUILD_PLAN 2.5: never floats). Parses German input and formats for
 * display in de-DE. No I/O.
 */

export type ParseResult = { ok: true; value: bigint } | { ok: false; error: 'empty' | 'invalid' | 'too-many-decimals' };

/**
 * Parses user input like "0,5", "1.234,56" or "12" into base units with `decimals` places.
 * - Comma is the decimal separator; dots are thousands separators and must group by three ("1.234,5").
 * - Without a comma, a single dot is read as decimal point ("0.5", e.g. pasted from another app) unless it forms
 *   valid thousands groups with more than one dot ("1.234.567").
 * - Spaces (also narrow no-break) are ignored. Signs, exponents and anything else are invalid.
 */
export function parseAmount(input: string, decimals: number): ParseResult {
  const s = input.replace(/[\s  ]/g, '');
  if (!s) return { ok: false, error: 'empty' };
  let intPart: string;
  let fracPart = '';
  if (s.includes(',')) {
    const m = /^(\d{1,3}(?:\.\d{3})+|\d*),(\d*)$/.exec(s);
    if (!m) return { ok: false, error: 'invalid' };
    intPart = m[1]!.replace(/\./g, '');
    fracPart = m[2]!;
  } else if (/^\d{1,3}(\.\d{3}){2,}$/.test(s)) {
    intPart = s.replace(/\./g, '');
  } else {
    const m = /^(\d*)(?:\.(\d*))?$/.exec(s);
    if (!m) return { ok: false, error: 'invalid' };
    intPart = m[1]!;
    fracPart = m[2] ?? '';
  }
  if (!intPart && !fracPart) return { ok: false, error: 'invalid' };
  const trimmedFrac = fracPart.replace(/0+$/, '');
  if (trimmedFrac.length > decimals) return { ok: false, error: 'too-many-decimals' };
  const value = BigInt(intPart || '0') * 10n ** BigInt(decimals) + BigInt(trimmedFrac.padEnd(decimals, '0') || '0');
  return { ok: true, value };
}

export interface FormatOptions {
  /** Maximum fraction digits shown; the rest is cut off (never rounded up). Default: all `decimals`. */
  maxFraction?: number;
  /** Minimum fraction digits (padded with zeros). Default 0. */
  minFraction?: number;
  /** Thousands separators ("1.234,5"). Default true. */
  grouping?: boolean;
}

/** Formats base units for display in de-DE, e.g. formatAmount(1500000000000000000n, 18) → "1,5". */
export function formatAmount(value: bigint, decimals: number, { maxFraction = decimals, minFraction = 0, grouping = true }: FormatOptions = {}): string {
  const negative = value < 0n;
  const abs = negative ? -value : value;
  const base = 10n ** BigInt(decimals);
  const intDigits = (abs / base).toString();
  let frac = decimals > 0 ? (abs % base).toString().padStart(decimals, '0') : '';
  frac = frac.slice(0, Math.min(maxFraction, decimals)).replace(/0+$/, '');
  frac = frac.padEnd(Math.min(minFraction, decimals), '0');
  const int = grouping ? intDigits.replace(/\B(?=(\d{3})+(?!\d))/g, '.') : intDigits;
  return (negative ? '−' : '') + int + (frac ? ',' + frac : '');
}

/** Base units → floating-point number, only for fiat display (BUILD_PLAN 2.5). */
export function toDisplayNumber(value: bigint, decimals: number): number {
  const base = 10n ** BigInt(decimals);
  return Number(value / base) + Number(value % base) / Number(base);
}
