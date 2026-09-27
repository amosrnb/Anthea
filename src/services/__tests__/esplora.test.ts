import { addressUsed, ESPLORA } from '../esplora';

const stats = (chain: number, mempool: number) => ({ chain_stats: { tx_count: chain }, mempool_stats: { tx_count: mempool } });
const fetchReturning = (body: unknown, status = 200) =>
  jest.fn(async (_url: string, _init?: RequestInit) => ({ ok: status < 300, status, json: async () => body }) as Response);

describe('Esplora address lookup', () => {
  it('uses testnet4 for testnet and mainnet otherwise', async () => {
    const f = fetchReturning(stats(0, 0));
    await addressUsed('tb1qexample', 'testnet', f as unknown as typeof fetch);
    await addressUsed('bc1qexample', 'mainnet', f as unknown as typeof fetch);
    expect(f.mock.calls[0]![0]).toBe(`${ESPLORA.testnet}/address/tb1qexample`);
    expect(f.mock.calls[1]![0]).toBe('https://mempool.space/api/address/bc1qexample');
  });

  it('counts confirmed and unconfirmed transactions', async () => {
    expect(await addressUsed('a', 'mainnet', fetchReturning(stats(0, 0)) as unknown as typeof fetch)).toBe(false);
    expect(await addressUsed('a', 'mainnet', fetchReturning(stats(0, 1)) as unknown as typeof fetch)).toBe(true);
    expect(await addressUsed('a', 'mainnet', fetchReturning(stats(2, 0)) as unknown as typeof fetch)).toBe(true);
  });

  it('fails on HTTP errors', async () => {
    await expect(addressUsed('a', 'mainnet', fetchReturning({}, 429) as unknown as typeof fetch)).rejects.toThrow('Esplora HTTP 429');
  });

  it('aborts after the timeout', async () => {
    jest.useFakeTimers();
    const f = jest.fn(
      (_url: string, init?: RequestInit) => new Promise<Response>((_, reject) => init!.signal!.addEventListener('abort', () => reject(new Error('aborted')))),
    );
    const p = addressUsed('a', 'mainnet', f as unknown as typeof fetch);
    jest.advanceTimersByTime(10_000);
    await expect(p).rejects.toThrow('aborted');
    jest.useRealTimers();
  });
});
