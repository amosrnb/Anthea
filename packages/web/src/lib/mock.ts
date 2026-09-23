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
