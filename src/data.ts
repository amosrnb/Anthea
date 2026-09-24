export const IND = '#6C5CE7';
export const ACC = '#A79BFF';
export const POS = '#A8E6A8';
export const NEG = '#FF8F80';
export const MUT = '#9A9AA3';
export const WARN = '#E8C46A';
export const INK = '#F7F7F5';

export type Currency = 'EUR' | 'USD' | 'GBP' | 'CHF';
export const RATES: Record<Currency, number> = { EUR: 1, USD: 1.08, GBP: 0.85, CHF: 0.95 };

export type Family = 'evm' | 'sol' | 'btc';

export interface Asset {
  id: string;
  sym: string;
  name: string;
  net: string;
  bal: number;
  dec: number;
  price: number | null;
  chg: number | null;
  pending?: number;
  unverified?: boolean;
  mark: string;
  bg: string;
  ink: string;
  coin?: string;
}

export const ASSETS: Asset[] = [
  { id: 'eth-eth', sym: 'ETH', name: 'Ethereum', net: 'Ethereum', bal: 1.842, dec: 4, price: 2884.1, chg: 1.24, mark: 'E', bg: '#5B5BC4', ink: '#FFFFFF', coin: 'eth' },
  { id: 'eth-base', sym: 'ETH', name: 'Ethereum', net: 'Base', bal: 0.412, dec: 4, price: 2884.1, chg: 1.24, mark: 'E', bg: '#5B5BC4', ink: '#FFFFFF', coin: 'eth' },
  { id: 'usdc-base', sym: 'USDC', name: 'USD Coin', net: 'Base', bal: 2683.1, dec: 2, price: 0.921, chg: 0.01, mark: '$', bg: '#4B7BE5', ink: '#FFFFFF', coin: 'usdc' },
  { id: 'arb-arb', sym: 'ARB', name: 'Arbitrum', net: 'Arbitrum', bal: 412.5, dec: 2, price: 0.72, chg: -2.41, mark: 'A', bg: '#2D6FD6', ink: '#FFFFFF', coin: 'arb' },
  { id: 'sol-sol', sym: 'SOL', name: 'Solana', net: 'Solana', bal: 18.204, dec: 3, price: 143.5, chg: 4.12, mark: 'S', bg: '#2A2340', ink: '#C9B8FF', coin: 'sol' },
  { id: 'jup-sol', sym: 'JUP', name: 'Jupiter', net: 'Solana', bal: 240, dec: 2, price: 0.76, chg: -0.8, mark: 'J', bg: '#1F2A1A', ink: POS, coin: 'jup' },
  { id: 'btc-btc', sym: 'BTC', name: 'Bitcoin', net: 'Bitcoin', bal: 0.04812, dec: 5, price: 61390, chg: 0.82, pending: 0.0012, mark: 'B', bg: '#D8862A', ink: '#1A0E00', coin: 'btc' },
  { id: 'kite-bnb', sym: 'KITE', name: 'Kite Token', net: 'BNB Chain', bal: 12000, dec: 0, price: null, chg: null, unverified: true, mark: '?', bg: '#2A2A32', ink: MUT }
];

export interface Coin {
  id: string;
  sym: string;
  name: string;
  price: number;
  chg: number;
  cap: string;
  vol: string;
  hi: number;
  lo: number;
  mark: string;
  bg: string;
  ink: string;
  asset: string | null;
  supported?: boolean;
}

export const COINS: Coin[] = [
  { id: 'btc', sym: 'BTC', name: 'Bitcoin', price: 61390, chg: 0.82, cap: '1,21 Bio. €', vol: '28,4 Mrd. €', hi: 61920, lo: 60410, mark: 'B', bg: '#D8862A', ink: '#1A0E00', asset: 'btc-btc' },
  { id: 'eth', sym: 'ETH', name: 'Ethereum', price: 2884.1, chg: 1.24, cap: '347,6 Mrd. €', vol: '14,1 Mrd. €', hi: 2910, lo: 2831, mark: 'E', bg: '#5B5BC4', ink: '#FFFFFF', asset: 'eth-eth' },
  { id: 'usdc', sym: 'USDC', name: 'USD Coin', price: 0.921, chg: 0.01, cap: '67,2 Mrd. €', vol: '6,8 Mrd. €', hi: 0.922, lo: 0.92, mark: '$', bg: '#4B7BE5', ink: '#FFFFFF', asset: 'usdc-base' },
  { id: 'bnb', sym: 'BNB', name: 'BNB', price: 548.2, chg: -0.61, cap: '80,0 Mrd. €', vol: '1,4 Mrd. €', hi: 556, lo: 541, mark: 'B', bg: '#E8C46A', ink: '#1A1400', asset: null, supported: true },
  { id: 'sol', sym: 'SOL', name: 'Solana', price: 143.5, chg: 4.12, cap: '67,9 Mrd. €', vol: '3,2 Mrd. €', hi: 145.1, lo: 137.2, mark: 'S', bg: '#2A2340', ink: '#C9B8FF', asset: 'sol-sol' },
  { id: 'xrp', sym: 'XRP', name: 'XRP', price: 0.54, chg: 2.1, cap: '30,4 Mrd. €', vol: '1,1 Mrd. €', hi: 0.55, lo: 0.52, mark: 'X', bg: '#23232A', ink: INK, asset: null, supported: false },
  { id: 'pol', sym: 'POL', name: 'Polygon', price: 0.38, chg: -1.9, cap: '3,5 Mrd. €', vol: '0,2 Mrd. €', hi: 0.39, lo: 0.37, mark: 'P', bg: '#6A45C9', ink: '#FFFFFF', asset: null, supported: true },
  { id: 'arb', sym: 'ARB', name: 'Arbitrum', price: 0.72, chg: -2.41, cap: '2,9 Mrd. €', vol: '0,3 Mrd. €', hi: 0.75, lo: 0.71, mark: 'A', bg: '#2D6FD6', ink: '#FFFFFF', asset: 'arb-arb' },
  { id: 'jup', sym: 'JUP', name: 'Jupiter', price: 0.76, chg: -0.8, cap: '1,0 Mrd. €', vol: '0,1 Mrd. €', hi: 0.78, lo: 0.74, mark: 'J', bg: '#1F2A1A', ink: POS, asset: 'jup-sol' }
];

export const SEED = ['orbit', 'velvet', 'harbor', 'canyon', 'marble', 'tunnel', 'lemon', 'rapid', 'ivory', 'signal', 'pepper', 'august'];
/** Demo subset of the BIP39 list used for import validation and suggestions. */
export const WORDS = SEED.concat(['abandon', 'ability', 'able', 'about', 'above', 'absent', 'cactus', 'rocket', 'ripple', 'silver', 'ocean', 'orange', 'order', 'velvet', 'venue', 'harvest', 'hat', 'canal', 'candy', 'canvas', 'march', 'margin', 'tunnel', 'turtle', 'lemon', 'lend', 'random', 'range', 'rapid', 'ivory', 'island', 'sign', 'silent', 'pen', 'people', 'pepper', 'audit', 'august', 'aunt']);
export const VERIFY = [
  { pos: 3, opts: ['rocket', 'harbor', 'marble'] },
  { pos: 7, opts: ['ripple', 'silver', 'lemon'] },
  { pos: 11, opts: ['pepper', 'cactus', 'orbit'] }
];

export const ADDR: Record<Family, string> = { evm: '0xB4a27C1e9D3f58A0b6E2c4D8f1A3e5C7b9D09Fc1', sol: '7xKpV3mR9qTn2WbYz8LcHd5FjAe4Ug6Ns1Po3Qr7iBtM', btc: 'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh' };
export const RECENT: Record<Family, string> = { evm: '0x71C9a3F2b8D4e6A1c0E5f7B9d2A4c6E8f0a104Ae', sol: '9xQeWvG816bUx9EPjHmaT23yvVM2ZWbrrpZb9PusVFin', btc: 'bc1q9h7garjcy5f3mzmx4sn5lzq9mfaz3kq7k2f0t' };
/** Look-alike of RECENT (same prefix/suffix) that "Einfügen" pastes to demo the address-poisoning warning. */
export const POISON: Record<Family, string> = { evm: '0x71C9e0B7d2F4a9C3e1A8b6D5f0C2e4A7b9d304Ae', sol: '9xQeRk3pLm7Tn2WbYz8LcHd5FjAe4Ug6Ns1PusVFin', btc: 'bc1q9h7gk2m8x4sn5lzq9mfaz3kq0wd8u4q7k2f0t' };
export const FRESH: Record<Family, string> = { evm: '0x3fA9c1D7e2B84a60F5d3C9e8A1b27D4c6E0f91B2', sol: '4Nd1mWqZ8vL2cTk6yHpR3sXe9bFjU7aGo5KrPiVtQw1', btc: 'bc1qar0srrr7xfkvy5l643lydnw9re59gtzzwf5mdq' };

export interface FeeTier { l: string; t: string; eur: number }
export const FEES: Record<'eth' | 'l2' | 'sol' | 'btc', FeeTier[]> = {
  eth: [{ l: 'Langsam', t: '~5 min', eur: 0.9 }, { l: 'Normal', t: '~1 min', eur: 1.6 }, { l: 'Schnell', t: '~15 s', eur: 2.8 }],
  l2: [{ l: 'Langsam', t: '~1 min', eur: 0.03 }, { l: 'Normal', t: '~10 s', eur: 0.06 }, { l: 'Schnell', t: '~2 s', eur: 0.12 }],
  sol: [{ l: 'Langsam', t: '~20 s', eur: 0.001 }, { l: 'Normal', t: '~5 s', eur: 0.004 }, { l: 'Schnell', t: '~1 s', eur: 0.012 }],
  btc: [{ l: 'Langsam', t: '~60 min', eur: 0.42 }, { l: 'Normal', t: '~30 min', eur: 0.95 }, { l: 'Schnell', t: '~10 min', eur: 1.58 }]
};

/** Receivable assets and the networks each can arrive on (first = default). */
export const RCV: Record<string, string[]> = { ETH: ['Ethereum', 'Base', 'Arbitrum', 'Optimism'], USDC: ['Base', 'Ethereum', 'Arbitrum', 'Solana'], SOL: ['Solana'], BTC: ['Bitcoin'], ARB: ['Arbitrum'], JUP: ['Solana'], BNB: ['BNB Chain'], POL: ['Polygon'] };
export const SWAPPABLE = ['eth-eth', 'eth-base', 'usdc-base', 'arb-arb', 'sol-sol', 'jup-sol'];

export const RPCS: [string, string][] = [
  ['Ethereum', 'ethereum-rpc.publicnode.com'], ['Arbitrum One', 'arbitrum-one-rpc.publicnode.com'], ['Optimism', 'optimism-rpc.publicnode.com'], ['Base', 'base-rpc.publicnode.com'],
  ['Polygon PoS', 'polygon-bor-rpc.publicnode.com'], ['BNB Smart Chain', 'bsc-rpc.publicnode.com'], ['Solana', 'solana-rpc.publicnode.com'], ['Bitcoin', 'mempool.space/api · Esplora']
];

export interface ActivityItem {
  id: string;
  t: 'swap' | 'send' | 'recv';
  title: string;
  sub: string;
  amt: string;
  status: string;
  day: 'HEUTE' | 'GESTERN';
  time: string;
  fee: string;
}

export const INITIAL_ACTIVITY: ActivityItem[] = [
  { id: 'a1', t: 'swap', title: 'USDC → ETH', sub: 'Base · LI.FI', amt: '+0,2104 ETH', status: 'Bestätigt', day: 'HEUTE', time: '09:12', fee: '0,06 €' },
  { id: 'a2', t: 'swap', title: 'ETH Arbitrum → Base', sub: 'Cross-Chain · LI.FI', amt: '0,1500 ETH', status: 'Unterwegs', day: 'HEUTE', time: '08:47', fee: '0,91 €' },
  { id: 'a3', t: 'recv', title: 'Empfangen', sub: 'Bitcoin · bc1q9h…2f0t', amt: '+0,00120 BTC', status: 'Unbestätigt', day: 'HEUTE', time: '08:05', fee: '–' },
  { id: 'a4', t: 'send', title: 'Gesendet', sub: 'Solana · 9xQeWv…VFin', amt: '−2,500 SOL', status: 'Bestätigt', day: 'GESTERN', time: '18:30', fee: '0,004 €' },
  { id: 'a5', t: 'recv', title: 'Empfangen', sub: 'Base · 0x71C9…04Ae', amt: '+500,00 USDC', status: 'Bestätigt', day: 'GESTERN', time: '11:02', fee: '–' }
];
