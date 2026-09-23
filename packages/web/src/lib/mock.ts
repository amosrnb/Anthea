import type { ChainId } from "@anthea/wallet-core";

/**
 * Prototype-only data: this is a frontend prototype with no backend or RPC
 * provider wired up yet. Real keys and addresses still come from
 * `@anthea/wallet-core` (derived on-device); only balances, prices, and
 * transaction execution are mocked here so the app is fast and demoable
 * without live network/funds dependencies.
 */

export interface MockAsset {
  chainId: ChainId;
  symbol: string;
  name: string;
  balance: number;
  usdPrice: number;
}

const MOCK_ASSETS: Record<ChainId, MockAsset> = {
  ethereum: { chainId: "ethereum", symbol: "ETH", name: "Ethereum", balance: 1.842, usdPrice: 3138.72 },
  solana: { chainId: "solana", symbol: "SOL", name: "Solana", balance: 18.41, usdPrice: 145.6 },
};

export function getMockAsset(chainId: ChainId): MockAsset {
  return MOCK_ASSETS[chainId];
}

export function getMockAssets(): MockAsset[] {
  return [MOCK_ASSETS.ethereum, MOCK_ASSETS.solana];
}

export function usdValue(asset: MockAsset): number {
  return asset.balance * asset.usdPrice;
}

export function totalUsdValue(): number {
  return getMockAssets().reduce((sum, asset) => sum + usdValue(asset), 0);
}

export function formatUsd(value: number): string {
  return value.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 2 });
}

export type PriceRange = "1D" | "1W" | "1M" | "1Y";

export const PRICE_RANGES: PriceRange[] = ["1D", "1W", "1M", "1Y"];

export interface PricePoint {
  timestamp: number;
  price: number;
}

const PRICE_RANGE_CONFIG: Record<PriceRange, { points: number; stepMs: number }> = {
  "1D": { points: 48, stepMs: 30 * 60 * 1000 },
  "1W": { points: 42, stepMs: 4 * 60 * 60 * 1000 },
  "1M": { points: 30, stepMs: 24 * 60 * 60 * 1000 },
  "1Y": { points: 52, stepMs: 7 * 24 * 60 * 60 * 1000 },
};

function hashSeed(input: string): number {
  let hash = 2166136261;
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function seededRandom(seed: number): () => number {
  let state = seed;
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 0xffffffff;
  };
}

/**
 * Deterministic mock price history for the token detail chart. Seeded by
 * chain + range so re-renders are stable, and walked *backward* from the
 * asset's current mock price so the series always lines up with the price
 * shown elsewhere in the app. Prototype-only — no real market data source is
 * wired up yet (see module doc above).
 */
export function getMockPriceHistory(chainId: ChainId, range: PriceRange): PricePoint[] {
  const { points, stepMs } = PRICE_RANGE_CONFIG[range];
  const currentPrice = getMockAsset(chainId).usdPrice;
  const rand = seededRandom(hashSeed(`${chainId}:${range}`));

  const volatility = 0.025;
  const prices: number[] = [currentPrice];
  for (let i = 1; i < points; i++) {
    const prev = prices[i - 1] ?? currentPrice;
    const drift = (rand() - 0.5) * 2 * volatility;
    prices.push(Math.max(prev * (1 + drift), currentPrice * 0.3));
  }
  prices.reverse();

  const now = Date.now();
  return prices.map((price, i) => ({
    timestamp: now - (points - 1 - i) * stepMs,
    price,
  }));
}

export function priceChangePct(history: PricePoint[]): number {
  const first = history[0];
  const last = history[history.length - 1];
  if (!first || !last || first === last) return 0;
  return ((last.price - first.price) / first.price) * 100;
}

const NETWORK_FEES: Record<ChainId, string> = {
  ethereum: "0.0009 ETH (~$2.83)",
  solana: "0.000005 SOL (~$0.001)",
};

export function estimateNetworkFee(chainId: ChainId): string {
  return NETWORK_FEES[chainId];
}

/** Simulates broadcasting a signed transaction. No real network call. */
export function simulateBroadcast(): Promise<string> {
  const hash =
    "0x" +
    Array.from({ length: 64 }, () => "0123456789abcdef"[Math.floor(Math.random() * 16)]).join("");
  return new Promise((resolve) => setTimeout(() => resolve(hash), 900));
}
