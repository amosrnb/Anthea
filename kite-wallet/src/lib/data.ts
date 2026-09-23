/**
 * Prototype-only data. Anthea V1 is a frontend prototype with no backend and
 * no RPC provider: balances, prices, fees, addresses and transaction broadcast
 * are all mocked here, and the seed phrase is a demo phrase, not real key material.
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
  return `${Number(v.toFixed(a.decimals))} ${a.symbol}`;
}

export function shortAddress(addr: string) {
  return addr.slice(0, 6) + '…' + addr.slice(-4);
}

export function isValidAddress(chain: ChainId, addr: string) {
  const a = addr.trim();
  if (chain === 'ethereum') return /^0x[0-9a-fA-F]{40}$/.test(a);
  return /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(a);
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
