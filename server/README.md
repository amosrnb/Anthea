# anthea-api

Stateless data proxy for the Anthea wallet (see `docs/BUILD_PLAN.md`, section 4.3), running as a Cloudflare Worker.
It only exists because licensed market data and full EVM history need API keys that must not ship in the app. It never
sees seeds, keys or signed transactions, stores no user data and does not log requests.

```sh
npm install
npm test           # vitest
npm run typecheck
npm run dev        # local worker on http://localhost:8787 (wrangler dev)
```

## Endpoints

| Endpoint | Status |
|---|---|
| `GET /v1/health` | Phase 0 — `{ status, version, asOf, source }` |
| `GET /v1/markets`, `/v1/chart/:coinId`, `/v1/token-prices`, `/v1/fx` | Phase 4 |
| `GET /v1/evm/history`, `/v1/evm/tokens` | Phase 5 / 8 |

Everything else answers `404`; methods other than `GET`/`HEAD` answer `405`. Every response carries `asOf` and
`source` and is sent with `cache-control: no-store` until endpoint-specific caching arrives in Phase 4.

## Configuration

- `wrangler.toml`: observability/logging disabled, Wrangler telemetry off (`send_metrics = false`).
- Secrets (market data provider, Etherscan) are added in later phases with `wrangler secret put` and never committed.
- Deployment (`npm run deploy`) needs a Cloudflare account; not set up yet (see BUILD_PLAN 13.2 for the open budget and
  domain decisions).
