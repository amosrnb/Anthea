import { formatAmount, parseAmount, toDisplayNumber } from '../amounts';

const ok = (value: bigint) => ({ ok: true, value });
const err = (error: string) => ({ ok: false, error });

describe('parseAmount', () => {
  it.each([
    ['0,5', 18, ok(500000000000000000n)],
    ['1', 6, ok(1000000n)],
    [',5', 2, ok(50n)],
    ['5,', 2, ok(500n)],
    ['1.234,56', 2, ok(123456n)],
    ['12.345.678,9', 1, ok(123456789n)],
    ['1 234,5', 1, ok(12345n)],
    ['0.5', 8, ok(50000000n)], // single dot without comma: decimal point (pasted)
    ['1.234.567', 0, ok(1234567n)], // several dot groups: thousands separators
    ['0,10000', 1, ok(1n)], // trailing zeros do not count as decimals
    ['0,00000001', 8, ok(1n)],
    ['123456789012345678901234567890', 0, ok(123456789012345678901234567890n)],
  ] as const)('%s with %i decimals', (input, decimals, expected) => {
    expect(parseAmount(input, decimals)).toEqual(expected);
  });

  it.each([
    ['', err('empty')],
    ['   ', err('empty')],
    [',', err('invalid')],
    ['.', err('invalid')],
    ['-1', err('invalid')],
    ['1e5', err('invalid')],
    ['1,2,3', err('invalid')],
    ['12.34,5', err('invalid')], // dots must group by three
    ['abc', err('invalid')],
    ['0,123', err('too-many-decimals')],
  ] as const)('rejects "%s"', (input, expected) => {
    expect(parseAmount(input, 2)).toEqual(expected);
  });
});

describe('formatAmount', () => {
  it('formats base units in de-DE', () => {
    expect(formatAmount(1500000000000000000n, 18)).toBe('1,5');
    expect(formatAmount(123456789n, 2)).toBe('1.234.567,89');
    expect(formatAmount(123456789n, 2, { grouping: false })).toBe('1234567,89');
    expect(formatAmount(0n, 8)).toBe('0');
    expect(formatAmount(42n, 0)).toBe('42');
  });

  it('cuts off (never rounds up) beyond maxFraction and pads to minFraction', () => {
    expect(formatAmount(199999n, 5, { maxFraction: 2 })).toBe('1,99');
    expect(formatAmount(100000n, 5, { minFraction: 4 })).toBe('1,0000');
    expect(formatAmount(1n, 8)).toBe('0,00000001');
    expect(formatAmount(12n, 1, { minFraction: 3 })).toBe('1,2');
  });

  it('marks negative values with a true minus sign', () => {
    expect(formatAmount(-2500n, 3)).toBe('−2,5');
  });

  it('round-trips with parseAmount', () => {
    for (const s of ['0,000001', '1.234.567,891011', '42']) {
      const parsed = parseAmount(s, 6);
      expect(parsed.ok && formatAmount(parsed.value, 6)).toBe(s);
    }
  });
});

describe('toDisplayNumber', () => {
  it('converts for fiat display only', () => {
    expect(toDisplayNumber(1500000000000000000n, 18)).toBe(1.5);
    expect(toDisplayNumber(123n, 0)).toBe(123);
  });
});
