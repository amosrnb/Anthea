import type { ChainId } from "@anthea/wallet-core";

/**
 * Prototype-only data: this is a frontend prototype with no backend and no
 * swap/RPC provider wired up yet (that lands with ANTA-7). Real keys and
 * addresses still come from `@anthea/wallet-core` (derived on-device); only
 * balances, prices, and transaction execution are mocked here so the app is
 * fast and demoable without live network/funds dependencies.
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

/** Deterministic-ish mock swap rate so the same pair always quotes close to the same price. */
function pairRate(fromSymbol: string, toSymbol: string): number {
  const price: Record<string, number> = { ETH: 3138.72, SOL: 145.6, USDC: 1 };
  const from = price[fromSymbol] ?? 1;
  const to = price[toSymbol] ?? 1;
  return from / to;
}

export interface SwapQuote {
  rate: number;
  toAmount: number;
  priceImpactPct: number;
  minReceived: number;
  fee: string;
}

export function getSwapQuote(fromSymbol: string, toSymbol: string, fromAmount: number): SwapQuote {
  const rate = pairRate(fromSymbol, toSymbol);
  const toAmount = fromAmount * rate;
  const priceImpactPct = fromAmount > 0 ? Math.min(0.02 + fromAmount / 5000, 1.5) : 0;
  const minReceived = toAmount * (1 - priceImpactPct / 100 - 0.005);
  return {
    rate,
    toAmount,
    priceImpactPct,
    minReceived,
    fee: "0.15%",
  };
}
