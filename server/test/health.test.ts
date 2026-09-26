import { describe, expect, it, vi } from 'vitest';
import worker, { handle, type Env } from '../src/index';

const env: Env = { API_VERSION: '0.1.0' };
const get = (path: string, init?: RequestInit) => handle(new Request('https://api.example' + path, init), env);

describe('GET /v1/health', () => {
  it('reports status, version, asOf and source', async () => {
    vi.useFakeTimers({ now: new Date('2026-09-26T09:41:00Z') });
    const res = await get('/v1/health');
    vi.useRealTimers();
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ status: 'ok', version: '0.1.0', asOf: Date.parse('2026-09-26T09:41:00Z'), source: 'anthea-api' });
  });

  it('is never cached and sends hardening headers', async () => {
    const res = await get('/v1/health');
    expect(res.headers.get('content-type')).toBe('application/json; charset=utf-8');
    expect(res.headers.get('cache-control')).toBe('no-store');
    expect(res.headers.get('x-content-type-options')).toBe('nosniff');
    expect(res.headers.get('referrer-policy')).toBe('no-referrer');
  });

  it('answers HEAD without a body', async () => {
    const res = await get('/v1/health', { method: 'HEAD' });
    expect(res.status).toBe(200);
    expect(await res.text()).toBe('');
  });

  it('ignores query strings', async () => {
    expect((await get('/v1/health?x=1')).status).toBe(200);
  });
});

describe('rejects everything else', () => {
  it.each(['/', '/v1', '/v1/health/', '/v2/health', '/v1/markets'])('404 for %s', async (path) => {
    const res = await get(path);
    expect(res.status).toBe(404);
    expect(await res.json()).toMatchObject({ error: 'not_found', source: 'anthea-api' });
  });

  it.each(['POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'])('405 for %s', async (method) => {
    const res = await get('/v1/health', { method });
    expect(res.status).toBe(405);
    expect(res.headers.get('allow')).toBe('GET, HEAD');
  });
});

describe('worker entry', () => {
  it('serves requests through fetch', async () => {
    const res = await worker.fetch(new Request('https://api.example/v1/health'), env);
    expect(res.status).toBe(200);
  });

  it('turns unexpected errors into a 500 without logging', async () => {
    const log = vi.spyOn(console, 'error');
    const broken = new Proxy({} as Env, {
      get() {
        throw new Error('boom 0x71C9a3F2b8D4e6A1c0E5f7B9d2A4c6E8f0a104Ae');
      },
    });
    const res = await worker.fetch(new Request('https://api.example/v1/health'), broken);
    expect(res.status).toBe(500);
    expect(await res.json()).toMatchObject({ error: 'internal_error' });
    expect(log).not.toHaveBeenCalled();
  });
});
