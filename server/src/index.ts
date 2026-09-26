/**
 * anthea-api: stateless data proxy for market data and EVM history (BUILD_PLAN 4.3).
 *
 * Rules that apply to every endpoint: no request logging, no user data stored, every response carries `asOf` and
 * `source`, unknown input is rejected with 400/404/405. Phase 0 only provides the health check.
 */

export interface Env {
  API_VERSION: string;
}

const SOURCE = 'anthea-api';

const BASE_HEADERS = {
  'content-type': 'application/json; charset=utf-8',
  'cache-control': 'no-store',
  'x-content-type-options': 'nosniff',
  'referrer-policy': 'no-referrer',
} as const;

export function json(status: number, body: unknown, headers: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(body), { status, headers: { ...BASE_HEADERS, ...headers } });
}

const error = (status: number, code: string, headers?: Record<string, string>) => json(status, { error: code, asOf: Date.now(), source: SOURCE }, headers);

type Route = (request: Request, env: Env) => Response | Promise<Response>;

const ROUTES: Record<string, Route> = {
  '/v1/health': (_request, env) => json(200, { status: 'ok', version: env.API_VERSION, asOf: Date.now(), source: SOURCE }),
};

export async function handle(request: Request, env: Env): Promise<Response> {
  const route = ROUTES[new URL(request.url).pathname];
  if (!route) return error(404, 'not_found');
  if (request.method !== 'GET' && request.method !== 'HEAD') return error(405, 'method_not_allowed', { allow: 'GET, HEAD' });
  const response = await route(request, env);
  return request.method === 'HEAD' ? new Response(null, response) : response;
}

export default {
  async fetch(request, env) {
    try {
      return await handle(request, env);
    } catch {
      // Deliberately no logging: error details could contain addresses (BUILD_PLAN 4.3).
      return error(500, 'internal_error');
    }
  },
} satisfies ExportedHandler<Env>;
