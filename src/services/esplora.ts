/**
 * Minimal Esplora client (mempool.space, BUILD_PLAN 4.4) for the Bitcoin gap-limit scan on import. Phase 3 moves it
 * onto the shared HTTP layer (retries, rate limits, fallback endpoints). Sees: IP address and queried addresses.
 */
import type { Network } from '../core/address';

export const ESPLORA: Record<Network, string> = {
  mainnet: 'https://mempool.space/api',
  // BUILD_PLAN 1.2: Bitcoin testnet4 (tb1 addresses).
  testnet: 'https://mempool.space/testnet4/api',
};

const TIMEOUT_MS = 10_000;

interface AddressStats {
  chain_stats: { tx_count: number };
  mempool_stats: { tx_count: number };
}

/** Whether the address has any confirmed or unconfirmed transaction. Throws on network errors and non-2xx. */
export async function addressUsed(address: string, network: Network, fetchImpl: typeof fetch = fetch): Promise<boolean> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetchImpl(`${ESPLORA[network]}/address/${encodeURIComponent(address)}`, { signal: controller.signal });
    if (!res.ok) throw new Error(`Esplora HTTP ${res.status}`);
    const stats = (await res.json()) as AddressStats;
    return stats.chain_stats.tx_count + stats.mempool_stats.tx_count > 0;
  } finally {
    clearTimeout(timer);
  }
}
