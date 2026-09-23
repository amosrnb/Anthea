# @anthea/web

Anthea's web app (ANT-5): onboarding, balances, send, and receive UI, built
directly on `@anthea/wallet-core` — no backend/custodial service in the path.
Key generation, encrypted storage, and signing all happen in
`@anthea/wallet-core`; this package only renders UI and calls it.

## Screens

- **Onboarding** (`/`, `/onboarding/create`, `/onboarding/import`) — create a
  new password-protected vault + wallet (with a mnemonic backup step), or
  import an existing mnemonic. Also reused for adding additional wallets to
  an already-unlocked vault (wallet-core supports multiple wallets per
  vault).
- **Unlock** (`/unlock`, shown automatically once a vault exists) — password
  prompt; `WalletManager.unlock()` re-derives everything from the encrypted
  vault. There's no separate app-level session persistence: refreshing the
  page always re-locks (matches wallet-core's "no lock(), just drop the
  reference" model, see its README).
- **Balances** (`/balances`) — wallet + account switcher, ETH/SOL balance
  cards per account (`WalletAccount.chain(id).getNativeBalance()`).
- **Send** (`/send?chain=ethereum|solana`) — recipient + amount →
  `ChainAccount.sendNative()`, shows the resulting tx hash/signature with an
  explorer link.
- **Receive** (`/receive?chain=ethereum|solana`) — address + QR code + copy.

## Design system

No separate "Brand and UI design system" package/doc was available in this
repo at the time this was built. `src/styles/tokens.css` defines a small,
self-contained set of CSS custom properties (colors, type scale, spacing,
radii) so the app is visually consistent; swap those values if/when a real
brand spec lands.

## Notable implementation detail

`@anthea/wallet-core`'s Solana derivation (`ed25519-hd-key`) and
`@solana/web3.js` expect Node's `Buffer` to exist. `vite.config.ts` polyfills
it via `vite-plugin-node-polyfills` (per the note left in wallet-core's
README for this integration).

## Development

```sh
npm install
npm run dev --workspace=@anthea/web       # http://localhost:5173
npm run typecheck --workspace=@anthea/web
npm run build --workspace=@anthea/web
```
