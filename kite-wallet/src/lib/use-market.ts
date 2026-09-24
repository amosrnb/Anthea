import { useEffect, useState } from 'react';

import type { ChainId, Range } from './data';
import { fetchHistory, scale, sumSeries, type History } from './prices';

type Result = { points: History | null; error: boolean };

/** Loads a series for `key`; `load` must be stable for a given key. Keeps showing nothing (not stale data) while the next key loads. */
function useSeries(key: string, load: () => Promise<History>): Result {
  const [state, setState] = useState<{ key: string } & Result>({ key: '', points: null, error: false });
  useEffect(() => {
    let live = true;
    load()
      .then((points) => live && setState({ key, points, error: false }))
      .catch(() => live && setState({ key, points: null, error: true }));
    return () => {
      live = false;
    };
    // `load` is keyed by `key`.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
  return state.key === key ? state : { points: null, error: false };
}

/** USD price history of one asset over a range. */
export function usePriceHistory(chain: ChainId, range: Range) {
  return useSeries(`${chain}:${range}`, () => fetchHistory(chain, range));
}

/** Current holdings valued at past prices over a range (what the portfolio line shows). */
export function usePortfolioHistory(amounts: Record<ChainId, number> | null, range: Range) {
  const chains = Object.keys(amounts ?? {}) as ChainId[];
  const key = amounts ? `${range}:${chains.map((c) => `${c}=${amounts[c]}`).join(',')}` : '';
  return useSeries(key, async () => {
    if (!amounts) throw new Error('Balances not loaded');
    const series = await Promise.all(chains.map((c) => fetchHistory(c, range).then((h) => scale(h, amounts[c]))));
    return sumSeries(series);
  });
}

/** Change from the first to the last point of a series. */
export function seriesChange(points: History | null) {
  if (!points || points.length < 2) return null;
  const first = points[0][1];
  const last = points[points.length - 1][1];
  return { abs: last - first, pct: first > 0 ? ((last - first) / first) * 100 : 0 };
}
