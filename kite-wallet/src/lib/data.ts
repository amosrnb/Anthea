import { colors } from './theme';

export const BALANCE = '$12,480.55';
export const WALLET_TOTAL = '$12,826.92';
export const USDC_BALANCE = 2683.1;
export const USDC_TO_WBTC = 0.0000152;
export const RECIPIENT = 'mira.kite';
export const RECEIVE_ADDRESS = '0xB4a2…9Fc1';

export type HoldingKind = 'Tokens' | 'Positions' | 'Predictions';

export type Holding = {
  kind: HoldingKind;
  mark: string;
  markBg: string;
  markInk: string;
  name: string;
  tag: string;
  sub: string;
  usd: string;
  chg: string;
  up: boolean;
};

export const HOLDINGS: Holding[] = [
  { kind: 'Tokens', mark: 'B', markBg: '#D8862A', markInk: '#1A0E00', name: 'Wrapped Bitcoin', tag: 'BASE', sub: '0.05188 WBTC', usd: '$3,289.79', chg: '+2.18%', up: true },
  { kind: 'Tokens', mark: '$', markBg: '#4B7BE5', markInk: '#FFFFFF', name: 'USD Coin', tag: 'ETH', sub: '2,683.10 USDC', usd: '$2,683.10', chg: '+0.01%', up: true },
  { kind: 'Tokens', mark: 'E', markBg: '#5B5BC4', markInk: '#FFFFFF', name: 'Ethereum', tag: 'ETH', sub: '1.842 ETH', usd: '$5,782.44', chg: '-1.24%', up: false },
  { kind: 'Positions', mark: '100', markBg: '#3A2126', markInk: colors.neg, name: 'Nasdaq 100', tag: 'SHORT 10×', sub: 'Entry $7,180.40', usd: '$412.60', chg: '+9.42%', up: true },
  { kind: 'Positions', mark: 'AU', markBg: '#3A3322', markInk: '#E8C46A', name: 'Gold', tag: 'LONG 3×', sub: 'Entry $3,379.10', usd: '$204.15', chg: '-0.60%', up: false },
  { kind: 'Predictions', mark: '?', markBg: '#1F2A1A', markInk: colors.accentText, name: 'Rain in Lisbon', tag: 'OCT', sub: 'Weather · 62¢ yes', usd: '$92.18', chg: '-$4.02', up: false },
];

export const FILTERS = ['All', 'Tokens', 'Positions', 'Predictions'] as const;
export type Filter = (typeof FILTERS)[number];

export type Wallet = { name: string; handle: string; color: string; bal: string; addr: string; state: string };

export const WALLETS: Wallet[] = [
  { name: 'Main', handle: 'ava.kite', color: '#6C5CE7', bal: '$8,412.20', addr: '0xB4a2…9Fc1', state: 'LEDGER' },
  { name: 'Family', handle: 'family.kite', color: '#B9C6D6', bal: '$1,204.55', addr: '0x71c9…04Ae', state: 'SHARED' },
  { name: 'Savings', handle: 'save.kite', color: '#A8E6A8', bal: '$2,140.00', addr: '0x2fD1…77b3', state: 'COLD' },
  { name: 'Spending', handle: 'spend.kite', color: '#4B7BE5', bal: '$318.90', addr: '0x9aE4…12cD', state: 'HOT' },
  { name: 'Gifts', handle: 'gifts.kite', color: '#D8862A', bal: '$96.40', addr: '0x6b02…Ba90', state: 'HOT' },
  { name: 'Lunch', handle: 'lunch.kite', color: '#E2B7C8', bal: '$41.12', addr: '0xF14c…3e77', state: 'HOT' },
  { name: 'Trading', handle: 'trade.kite', color: '#FF8F80', bal: '$612.75', addr: '0x0Dd8…5A1f', state: 'HOT' },
];

export const IMPORT_OPTIONS = [
  { title: 'Seed phrase', sub: 'Import with a 12 or 24 word phrase.', color: '#6C5CE7' },
  { title: 'Watch an address', sub: 'Track any address or .kite name.', color: '#B9C6D6' },
  { title: 'Hardware wallet', sub: 'Connect a signing device over USB.', color: '#4B7BE5' },
];

export const NFT_COLORS = ['#6C5CE7', '#A8E6A8', '#E2B7C8', '#D8862A', '#B9C6D6', '#E8C46A'];

/** 7×7 pixel-art avatar mask; 1 = white pixel. */
export const AVATAR = [
  0, 1, 1, 1, 1, 1, 0,
  1, 1, 1, 1, 1, 1, 1,
  1, 0, 1, 1, 0, 1, 1,
  1, 1, 1, 1, 1, 1, 1,
  1, 1, 0, 0, 0, 1, 1,
  0, 1, 1, 1, 1, 1, 0,
  0, 0, 1, 1, 1, 0, 0,
];

export type Range = { label: string; n: number; vol: number; trend: number; delta: string; abs: string };

export const RANGES: Range[] = [
  { label: '1H', n: 26, vol: 0.5, trend: 0.3, delta: '+0.42%', abs: '+$52.10' },
  { label: '1D', n: 40, vol: 1, trend: 1.1, delta: '+3.40%', abs: '+$412.20' },
  { label: '1W', n: 48, vol: 1.4, trend: 2.2, delta: '+8.10%', abs: '+$934.60' },
  { label: '1M', n: 54, vol: 1.8, trend: 3.4, delta: '-2.60%', abs: '-$328.40' },
  { label: '1Y', n: 60, vol: 2.4, trend: 6, delta: '+41.8%', abs: '+$3,680.90' },
  { label: 'Max', n: 64, vol: 3, trend: 9, delta: '+184%', abs: '+$8,042.15' },
];

export function rangeCaption(label: string) {
  if (label === 'Max') return 'all time';
  if (label === '1D') return 'today';
  return 'past ' + label;
}

/** Deterministic sample price path, smoothed with quadratic midpoints. Returns line and area paths. */
export function chartPaths(r: Range, W: number, H: number) {
  const seed = r.label.charCodeAt(0) + r.n;
  const vs: number[] = [];
  for (let i = 0; i < r.n; i++) {
    const t = i / (r.n - 1);
    const noise = Math.sin(i * 1.7 + seed) * 0.6 + Math.sin(i * 0.53 + seed * 0.7) * 0.9 + Math.sin(i * 3.1 + seed * 1.3) * 0.28;
    vs.push(noise * r.vol + t * r.trend * (r.label === '1M' ? -1 : 1));
  }
  const lo = Math.min(...vs);
  const span = Math.max(...vs) - lo || 1;
  const xy = vs.map((v, i) => ({ x: (i / (r.n - 1)) * W, y: 5 + (1 - (v - lo) / span) * (H - 10) }));
  const f = (n: number) => n.toFixed(1);
  let line = `M${f(xy[0].x)} ${f(xy[0].y)}`;
  for (let i = 1; i < xy.length; i++) {
    const p0 = xy[i - 1];
    const p1 = xy[i];
    line += ` Q${f(p0.x)} ${f(p0.y)} ${f((p0.x + p1.x) / 2)} ${f((p0.y + p1.y) / 2)}`;
  }
  const last = xy[xy.length - 1];
  line += ` L${f(last.x)} ${f(last.y)}`;
  return { line, area: `${line} L${W} ${H} L0 ${H} Z` };
}

/** 29×29 decorative QR matrix: three finder squares, pseudo-random fill, clear centre for the logo. */
export function qrMatrix(N = 29): boolean[] {
  const cells: boolean[] = [];
  const finder = (r: number, c: number) => {
    for (const [r0, c0] of [[0, 0], [0, N - 7], [N - 7, 0]]) {
      if (r >= r0 && r < r0 + 7 && c >= c0 && c < c0 + 7) {
        const edge = r === r0 || r === r0 + 6 || c === c0 || c === c0 + 6;
        const core = r >= r0 + 2 && r <= r0 + 4 && c >= c0 + 2 && c <= c0 + 4;
        return edge || core ? 1 : 0;
      }
    }
    return -1;
  };
  for (let r = 0; r < N; r++) {
    for (let c = 0; c < N; c++) {
      const f = finder(r, c);
      if (f >= 0) {
        cells.push(f === 1);
        continue;
      }
      const mid = r > 10 && r < 18 && c > 10 && c < 18;
      const h = Math.sin(r * 12.9898 + c * 78.233) * 43758.5453;
      cells.push(!mid && h - Math.floor(h) > 0.48);
    }
  }
  return cells;
}
