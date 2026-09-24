/**
 * Static asset metadata and formatting helpers. Live data comes from
 * `wallet-context.tsx`: balances, fees, sends and transaction status from the
 * chains over RPC (via @anthea/wallet-core), prices and chart history from
 * CoinGecko (`prices.ts`).
 */
import type { Network } from '@anthea/wallet-core';

export type ChainId = 'ethereum' | 'solana';
export type { Network };

export type Asset = {
  chainId: ChainId;
  symbol: string;
  name: string;
  /** Network name shown to the user, per network. */
  networks: Record<Network, string>;
  mark: string;
  markBg: string;
  markInk: string;
  /** Decimals shown in the UI (the chain itself uses 18 for ETH and 9 for SOL). */
  decimals: number;
  /** Where to get free test coins. */
  faucetUrl: string;
};

export const ASSETS: Record<ChainId, Asset> = {
  ethereum: {
    chainId: 'ethereum',
    symbol: 'ETH',
    name: 'Ethereum',
    networks: { mainnet: 'Ethereum mainnet', testnet: 'Ethereum Sepolia testnet' },
    mark: 'E',
    markBg: '#5B5BC4',
    markInk: '#FFFFFF',
    decimals: 6,
    faucetUrl: 'https://cloud.google.com/application/web3/faucet/ethereum/sepolia',
  },
  solana: {
    chainId: 'solana',
    symbol: 'SOL',
    name: 'Solana',
    networks: { mainnet: 'Solana mainnet', testnet: 'Solana Devnet' },
    mark: 'S',
    markBg: '#A8E6A8',
    markInk: '#0B1A0B',
    decimals: 4,
    faucetUrl: 'https://faucet.solana.com',
  },
};

export const CHAINS: ChainId[] = ['ethereum', 'solana'];

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

export function formatPct(v: number) {
  return `${v >= 0 ? '+' : ''}${v.toFixed(2)}%`;
}

/** Cuts a decimal string to at most `places` decimals, rounding down (so a Max amount is never more than the balance). */
export function truncateDecimals(value: string, places: number) {
  const [whole, frac = ''] = value.split('.');
  const cut = frac.slice(0, places).replace(/0+$/, '');
  return cut ? `${whole}.${cut}` : whole;
}

export const RANGES = ['1H', '1D', '1W', '1M', '1Y', 'Max'] as const;
export type Range = (typeof RANGES)[number];

export function rangeCaption(label: Range) {
  if (label === 'Max') return 'all time';
  if (label === '1D') return 'today';
  return 'past ' + label;
}

/** Line and area SVG paths through `values` (oldest first), smoothed with quadratic midpoints. */
export function chartPaths(values: number[], W: number, H: number) {
  if (values.length < 2) return null;
  const lo = Math.min(...values);
  const span = Math.max(...values) - lo || 1;
  const xy = values.map((v, i) => ({ x: (i / (values.length - 1)) * W, y: 5 + (1 - (v - lo) / span) * (H - 10) }));
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
