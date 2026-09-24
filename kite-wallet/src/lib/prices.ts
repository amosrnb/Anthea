import type { ChainId } from './data';
import { COINGECKO_API_KEY } from './config';

/**
 * Market data from CoinGecko's public API (mainnet ETH and SOL prices; test
 * coins have no market price of their own). Called straight from the app,
 * with a small in-memory cache so range switches don't hit the rate limit.
 */
const IDS: Record<ChainId, string> = { ethereum: 'ethereum', solana: 'solana' };
const BASE = 'https://api.coingecko.com/api/v3';
const SPOT_TTL = 60_000;
const HISTORY_TTL = 5 * 60_000;

export type Spot = { usd: number; change24h: number | null };
/** [unix ms, usd] points, oldest first. */
export type History = [number, number][];

const cache = new Map<string, { at: number; data: Promise<unknown> }>();

async function get<T>(path: string, ttl: number): Promise<T> {
  const hit = cache.get(path);
  if (hit && Date.now() - hit.at < ttl) return hit.data as Promise<T>;
  const data = fetch(BASE + path, {
    headers: { accept: 'application/json', ...(COINGECKO_API_KEY ? { 'x-cg-demo-api-key': COINGECKO_API_KEY } : {}) },
  }).then(async (res) => {
    if (!res.ok) throw new Error(`Price data unavailable (${res.status})`);
    return res.json();
  });
  cache.set(path, { at: Date.now(), data });
  // Don't cache failures.
  data.catch(() => cache.delete(path));
  return data as Promise<T>;
}

export async function fetchSpot(): Promise<Record<ChainId, Spot>> {
  const ids = Object.values(IDS).join(',');
  const res = await get<Record<string, { usd?: number; usd_24h_change?: number }>>(
    `/simple/price?ids=${ids}&vs_currencies=usd&include_24hr_change=true`,
    SPOT_TTL,
  );
  const spot = (chain: ChainId): Spot => {
    const r = res[IDS[chain]];
    if (typeof r?.usd !== 'number') throw new Error('Price data unavailable');
    return { usd: r.usd, change24h: typeof r.usd_24h_change === 'number' ? r.usd_24h_change : null };
  };
  return { ethereum: spot('ethereum'), solana: spot('solana') };
}

/** How far back each chart range reaches. 'Max' is all history where the API plan allows it, else a year. */
const RANGE_MS: Record<string, number> = {
  '1H': 3_600_000,
  '1D': 86_400_000,
  '1W': 7 * 86_400_000,
  '1M': 30 * 86_400_000,
  '1Y': 365 * 86_400_000,
};

export async function fetchHistory(chain: ChainId, range: string): Promise<History> {
  const chart = (days: string) =>
    get<{ prices?: History }>(`/coins/${IDS[chain]}/market_chart?vs_currency=usd&days=${days}`, HISTORY_TTL);
  const days = range === '1H' || range === '1D' ? '1' : range === '1W' ? '7' : range === '1M' ? '30' : '365';
  // The free public API caps history at a year, so 'Max' falls back to that.
  const res = range === 'Max' ? await chart('max').catch(() => chart('365')) : await chart(days);
  const prices = res.prices ?? [];
  if (range === 'Max') return prices;
  const since = Date.now() - RANGE_MS[range];
  const points = prices.filter(([t]) => t >= since);
  return points.length >= 2 ? points : prices;
}

/** Value of `amount` over time: the price history scaled by a fixed amount. */
export function scale(history: History, amount: number): History {
  return history.map(([t, p]) => [t, p * amount]);
}

/**
 * Sum several series on the timestamps of the first one (nearest earlier
 * point from the others). Used for the portfolio line: today's holdings
 * valued at each past price, as most wallets show it.
 */
export function sumSeries(series: History[]): History {
  const [base, ...rest] = series.filter((s) => s.length > 0);
  if (!base) return [];
  return base.map(([t, v]) => {
    let total = v;
    for (const s of rest) {
      let j = 0;
      while (j + 1 < s.length && s[j + 1][0] <= t) j++;
      total += s[j][1];
    }
    return [t, total];
  });
}
