import { ADDR, INK, RECENT, type Family } from './data';

export const famOf = (net: string): Family => (net === 'Solana' ? 'sol' : net === 'Bitcoin' ? 'btc' : 'evm');
export const short = (a: string) => (a ? a.slice(0, 6) + '…' + a.slice(-4) : '');
export const nf = (n: number, d: number) => Number(n).toLocaleString('de-DE', { minimumFractionDigits: d, maximumFractionDigits: d });
export const pc = (c: number | null) => (c == null ? '' : (c >= 0 ? '+' : '−') + nf(Math.abs(c), 2) + ' %');

export interface ChartPaths { line: string; area: string }

/** Deterministic pseudo price series rendered as a smoothed SVG path in a W×H box. */
export function chart(seed: number, n: number, vol: number, trend: number, W: number, H: number): ChartPaths {
  const pts: { x: number; v: number }[] = [];
  for (let i = 0; i < n; i++) {
    const t = i / (n - 1);
    const v = (Math.sin(i * 1.7 + seed) * 0.6 + Math.sin(i * 0.53 + seed * 0.7) * 0.9 + Math.sin(i * 3.1 + seed * 1.3) * 0.28) * vol + t * trend;
    pts.push({ x: t * W, v });
  }
  const vs = pts.map((p) => p.v);
  const lo = Math.min(...vs);
  const span = Math.max(...vs) - lo || 1;
  const xy = pts.map((p) => ({ x: p.x, y: 4 + (1 - (p.v - lo) / span) * (H - 8) }));
  let line = 'M' + xy[0].x.toFixed(1) + ' ' + xy[0].y.toFixed(1);
  for (let i = 1; i < xy.length; i++) {
    const a = xy[i - 1], b = xy[i];
    line += ' Q' + a.x.toFixed(1) + ' ' + a.y.toFixed(1) + ' ' + ((a.x + b.x) / 2).toFixed(1) + ' ' + ((a.y + b.y) / 2).toFixed(1);
  }
  const l = xy[xy.length - 1];
  line += ' L' + l.x.toFixed(1) + ' ' + l.y.toFixed(1);
  return { line, area: line + ' L' + W + ' ' + H + ' L0 ' + H + ' Z' };
}

/** Decorative 29×29 QR-style matrix (finder patterns + hashed noise, center cleared for the logo). */
export function qrCells(addr: string): string[] {
  const N = 29;
  const seedQ = addr.split('').reduce((s, ch) => s + ch.charCodeAt(0), 0);
  const cells: string[] = [];
  for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) {
    let f = -1;
    for (const [r0, c0] of [[0, 0], [0, N - 7], [N - 7, 0]]) {
      if (r >= r0 && r < r0 + 7 && c >= c0 && c < c0 + 7) {
        f = r === r0 || r === r0 + 6 || c === c0 || c === c0 + 6 || (r >= r0 + 2 && r <= r0 + 4 && c >= c0 + 2 && c <= c0 + 4) ? 1 : 0;
      }
    }
    if (f >= 0) { cells.push(f ? '#000000' : INK); continue; }
    const h = Math.sin(r * 12.9898 + c * 78.233 + seedQ) * 43758.5453;
    cells.push(!(r > 10 && r < 18 && c > 10 && c < 18) && h - Math.floor(h) > 0.5 ? '#000000' : INK);
  }
  return cells;
}

export type AddrCheck = { kind: 'ok' | 'info' | 'warn' | 'err'; text: string };

/** Recipient checks: format, network family, self-send, known recipient, and look-alike (address poisoning). */
export function validateAddress(addr: string, fam: Family, sym: string, net: string): AddrCheck | null {
  if (!addr) return null;
  const a = addr.trim();
  const isEvm = /^0x[0-9a-fA-F]{40}$/.test(a);
  const isBtc = /^(bc1|tb1)[0-9a-z]{20,80}$/.test(a);
  const isSol = !isEvm && !isBtc && /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(a);
  const got: Family | null = isEvm ? 'evm' : isBtc ? 'btc' : isSol ? 'sol' : null;
  const names: Record<Family, string> = { evm: 'EVM', btc: 'Bitcoin', sol: 'Solana' };
  if (!got) return { kind: 'err', text: 'Ungültige Adresse.' };
  if (got !== fam) return { kind: 'err', text: 'Das ist eine ' + names[got] + '-Adresse. ' + sym + ' wird hier über ' + net + ' gesendet.' };
  if (a === ADDR[fam]) return { kind: 'err', text: 'Das ist deine eigene Adresse.' };
  const r = RECENT[fam];
  if (a === r) return { kind: 'ok', text: 'Bekannter Empfänger · zuletzt am 12. Sep.' };
  if (a.slice(0, 6) === r.slice(0, 6) && a.slice(-4) === r.slice(-4)) {
    return { kind: 'warn', text: 'Ähnelt einer Adresse aus deinem Verlauf, ist aber nicht identisch. Möglicher Address-Poisoning-Angriff. Prüfe jedes Zeichen.' };
  }
  return { kind: 'info', text: 'Erstmaliger Empfänger. Prüfe die Adresse sorgfältig.' };
}
