import type { Network, RpcConfig } from '@anthea/wallet-core';

import type { ChainId } from './data';

/**
 * Build-time configuration from `EXPO_PUBLIC_*` variables (see `.env.example`).
 * Expo inlines these into the app bundle, so anything set here can be read by
 * anyone with the app: only use RPC keys that are restricted to this app
 * (allowed origins / bundle IDs / rate limits), never a secret.
 *
 * Each variable must be read with its full literal name for Expo to inline it.
 */
const env = {
  ethereum: {
    mainnet: process.env.EXPO_PUBLIC_ETHEREUM_MAINNET_RPC_URL,
    testnet: process.env.EXPO_PUBLIC_ETHEREUM_SEPOLIA_RPC_URL,
  },
  solana: {
    mainnet: process.env.EXPO_PUBLIC_SOLANA_MAINNET_RPC_URL,
    testnet: process.env.EXPO_PUBLIC_SOLANA_DEVNET_RPC_URL,
  },
};

/** Network a fresh install starts on. Testnet unless the build says otherwise. */
export const DEFAULT_NETWORK: Network = process.env.EXPO_PUBLIC_DEFAULT_NETWORK === 'mainnet' ? 'mainnet' : 'testnet';

/** Optional CoinGecko Demo API key, for higher price-data rate limits. */
export const COINGECKO_API_KEY = process.env.EXPO_PUBLIC_COINGECKO_API_KEY || undefined;

/** RPC settings for a chain on a network. Without a configured URL, wallet-core uses a rate-limited public endpoint. */
export function rpcConfig(chain: ChainId, network: Network): RpcConfig {
  return { network, rpcUrl: env[chain][network] || undefined };
}
