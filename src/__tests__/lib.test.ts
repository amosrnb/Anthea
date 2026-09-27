import { ADDR, POISON, RECENT } from '../data';
import { chart, famOf, nf, pc, qrCells, short, shuffled, validateAddress } from '../lib';

describe('formatting', () => {
  it('formats numbers in de-DE with fixed decimals', () => {
    expect(nf(15017.656, 2)).toBe('15.017,66');
    expect(nf(0.5, 4)).toBe('0,5000');
  });

  it('formats percent changes with sign and a true minus', () => {
    expect(pc(1.236)).toBe('+1,24 %');
    expect(pc(-2.41)).toBe('−2,41 %');
    expect(pc(null)).toBe('');
  });

  it('shortens addresses to 6…4', () => {
    expect(short(RECENT.evm)).toBe('0x71C9…04Ae');
    expect(short('')).toBe('');
  });

  it('maps networks to families', () => {
    expect(famOf('Solana')).toBe('sol');
    expect(famOf('Bitcoin')).toBe('btc');
    expect(famOf('Base')).toBe('evm');
  });
});

describe('chart', () => {
  it('builds a closed area below the line inside the box', () => {
    const { line, area } = chart(3, 20, 1, 1, 300, 64);
    expect(line.startsWith('M0.0 ')).toBe(true);
    expect(area).toBe(line + ' L300 64 L0 64 Z');
    const ys = [...line.matchAll(/[\d.]+ ([\d.]+)/g)].map((m) => Number(m[1]));
    expect(Math.min(...ys)).toBeGreaterThanOrEqual(4);
    expect(Math.max(...ys)).toBeLessThanOrEqual(60);
  });
});

describe('qrCells', () => {
  it('returns a 29×29 matrix with finder patterns', () => {
    const cells = qrCells(ADDR.evm);
    expect(cells).toHaveLength(29 * 29);
    expect(cells[0]).toBe('#000000');
    expect(cells[28]).toBe('#000000');
  });
});

describe('validateAddress', () => {
  it('accepts nothing for an empty field', () => {
    expect(validateAddress('', 'evm', 'ETH', 'Ethereum')).toBeNull();
  });

  it('rejects malformed and wrong-family addresses', () => {
    expect(validateAddress('0x123', 'evm', 'ETH', 'Ethereum')?.kind).toBe('err');
    expect(validateAddress(ADDR.btc, 'evm', 'ETH', 'Base')).toEqual({ kind: 'err', text: 'Das ist eine Bitcoin-Adresse. ETH wird hier über Base gesendet.' });
  });

  it('rejects the own address', () => {
    expect(validateAddress(ADDR.sol, 'sol', 'SOL', 'Solana')?.text).toBe('Das ist deine eigene Adresse.');
  });

  it.each(['evm', 'sol', 'btc'] as const)('recognizes the known %s recipient', (fam) => {
    expect(validateAddress(RECENT[fam], fam, 'X', 'Y')?.kind).toBe('ok');
  });

  it.each(['evm', 'btc'] as const)('warns about the %s look-alike (address poisoning)', (fam) => {
    expect(validateAddress(POISON[fam], fam, 'X', 'Y')?.kind).toBe('warn');
  });

  it('does not flag the Solana mock look-alike, whose prefix differs from the known address (prototype data, replaced in Phase 7)', () => {
    expect(POISON.sol.slice(0, 6)).not.toBe(RECENT.sol.slice(0, 6));
    expect(validateAddress(POISON.sol, 'sol', 'SOL', 'Solana')?.kind).toBe('info');
  });

  it('flags first-time recipients', () => {
    expect(validateAddress('0x' + 'a'.repeat(40), 'evm', 'ETH', 'Ethereum')?.kind).toBe('info');
  });
});

describe('shuffled', () => {
  it('returns a permutation without touching the input', () => {
    const input = ['a', 'b', 'c'];
    const out = shuffled(input, () => 0);
    expect(out).toEqual(['b', 'c', 'a']);
    expect(input).toEqual(['a', 'b', 'c']);
  });

  it('produces every order of three items', () => {
    const seen = new Set<string>();
    for (let k = 0; k < 400; k++) seen.add(shuffled(['a', 'b', 'c']).join(''));
    expect(seen.size).toBe(6);
  });
});
