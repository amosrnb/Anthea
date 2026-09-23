/**
 * Prototype-only data. Anthea V1 is a frontend prototype with no backend and
 * no RPC or swap provider: balances, prices, swap rates, chart history, fees,
 * addresses and transaction broadcast are all mocked here, and the seed phrase is a demo phrase, not real key material.
 */

export type ChainId = 'ethereum' | 'solana';

export type Asset = {
  chainId: ChainId;
  symbol: string;
  name: string;
  network: string;
  mark: string;
  markBg: string;
  markInk: string;
  usdPrice: number;
  decimals: number;
  address: string;
  fee: number;
};

export const ASSETS: Record<ChainId, Asset> = {
  ethereum: {
    chainId: 'ethereum',
    symbol: 'ETH',
    name: 'Ethereum',
    network: 'Ethereum mainnet',
    mark: 'E',
    markBg: '#5B5BC4',
    markInk: '#FFFFFF',
    usdPrice: 3138.72,
    decimals: 6,
    address: '0xB4a27c1E90d35f6A2b8C44e1D07F3a9e5c2D9Fc1',
    fee: 0.0009,
  },
  solana: {
    chainId: 'solana',
    symbol: 'SOL',
    name: 'Solana',
    network: 'Solana mainnet',
    mark: 'S',
    markBg: '#A8E6A8',
    markInk: '#0B1A0B',
    usdPrice: 145.6,
    decimals: 4,
    address: '7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU',
    fee: 0.000005,
  },
};

export const CHAINS: ChainId[] = ['ethereum', 'solana'];

export const START_BALANCES: Record<ChainId, number> = { ethereum: 1.842, solana: 18.41 };

export function formatUsd(v: number) {
  return v.toLocaleString('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function formatAmount(v: number, a: Asset) {
  const n = Number(v.toFixed(a.decimals));
  // Keep tiny non-zero amounts (e.g. the SOL network fee) from rounding to 0.
  return `${n === 0 && v > 0 ? Number(v.toPrecision(2)) : n} ${a.symbol}`;
}

export function shortAddress(addr: string) {
  return addr.slice(0, 6) + '…' + addr.slice(-4);
}

export function isValidAddress(chain: ChainId, addr: string) {
  const a = addr.trim();
  if (chain === 'ethereum') return /^0x[0-9a-fA-F]{40}$/.test(a);
  return /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(a);
}

/** Mock exchange rate between two assets, from their mock USD prices. */
export function mockRate(from: ChainId, to: ChainId) {
  return ASSETS[from].usdPrice / ASSETS[to].usdPrice;
}

/** Simulates broadcasting a signed transaction. No network call. */
export function simulateBroadcast(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, 900));
}

// Words from the BIP39 English list, used only to build a demo phrase.
const WORDS = (
  'abandon ability able about above absent absorb abstract absurd abuse access accident account accuse achieve acid ' +
  'acoustic acquire across act action actor actress actual adapt add addict address adjust admit adult advance ' +
  'advice aerobic affair afford afraid again age agent agree ahead aim air airport aisle alarm album alcohol alert ' +
  'alien all alley allow almost alone alpha already also alter always amateur amazing among amount amused analyst ' +
  'anchor ancient anger angle angry animal ankle announce annual another answer antenna antique anxiety any apart ' +
  'apology appear apple approve april arch arctic area arena argue arm armed armor army around arrange arrest ' +
  'arrive arrow art artefact artist artwork ask aspect assault asset assist assume asthma athlete atom attack ' +
  'attend attitude attract auction audit august aunt author auto autumn average avocado avoid awake aware away ' +
  'awesome awful awkward axis baby bachelor bacon badge bag balance balcony ball bamboo banana banner bar barely ' +
  'bargain barrel base basic basket battle beach bean beauty because become beef before begin behave behind ' +
  'believe below belt bench benefit best betray better between beyond bicycle bid bike bind biology bird birth ' +
  'bitter black blade blame blanket blast bleak bless blind blood blossom blouse blue blur blush board boat'
).split(' ');

export const WORDLIST = WORDS;

/** Demo 12-word phrase. Not generated from real entropy and not usable as a real wallet. */
export function demoMnemonic(): string[] {
  const picked: string[] = [];
  while (picked.length < 12) {
    const w = WORDS[Math.floor(Math.random() * WORDS.length)];
    if (!picked.includes(w)) picked.push(w);
  }
  return picked;
}

export function parseMnemonic(input: string): string[] | null {
  const words = input.trim().toLowerCase().split(/\s+/).filter(Boolean);
  if (words.length !== 12 && words.length !== 24) return null;
  if (!words.every((w) => /^[a-z]+$/.test(w))) return null;
  return words;
}

// Portfolio chart: mocked price history per range.
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

/** 29×29 decorative QR matrix seeded by the address: finder squares, pseudo-random fill, clear centre for the logo. */
export function qrMatrix(seedText: string, N = 29): boolean[] {
  let seed = 0;
  for (let i = 0; i < seedText.length; i++) seed = (seed * 31 + seedText.charCodeAt(i)) % 9973;
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
      const h = Math.sin(r * 12.9898 + c * 78.233 + seed) * 43758.5453;
      cells.push(!mid && h - Math.floor(h) > 0.48);
    }
  }
  return cells;
}

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
