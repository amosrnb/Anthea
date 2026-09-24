# Anthea

Mobile app of Anthea, a non-custodial multi-chain wallet (Ethereum and Solana), built with Expo (SDK 57), Expo Router and TypeScript. The visual design comes from the Claude Design handoff in `../project/`.

## What is live

**Real**, via [`@anthea/wallet-core`](../packages/wallet-core):
- The seed phrase is generated on the device from secure randomness (BIP-39). Addresses are derived from it (Ethereum `m/44'/60'/0'/0/0`, Solana `m/44'/501'/0'/0'`, the same as MetaMask and Phantom).
- The vault is encrypted with the password (PBKDF2-SHA256, 600,000 iterations + AES-256-GCM). On iOS/Android it is also kept in the Keychain/Keystore, device-only.
- **Balances** are read from the chain over RPC. They refresh on unlock, every 30 seconds, when the app returns to the foreground and on pull-to-refresh.
- **Send** estimates the network fee live, signs on the device and broadcasts. The status (pending, confirmed, failed) shows on Home, with a link to the block explorer.
- **Receive** shows the real address and a real, scannable QR code.
- **Prices and charts** come from CoinGecko. The token chart is the market price. The portfolio chart values today's holdings at past prices, as most wallets do.

**Not live yet:** Swap. It quotes ETH ↔ SOL at the market price but doesn't submit anything, because a cross-chain swap needs a bridge/swap provider.

## Networks: testnet first

The app starts on the **test network**: Ethereum **Sepolia** and Solana **Devnet**, where coins are free and worthless. A `TESTNET` badge shows on Home. Switch to mainnet in **Settings → Network**, which asks for confirmation first. The seed phrase and addresses are the same on both networks.

Getting test coins (Receive, on testnet):
- **SOL**: *Get 1 test SOL* asks the Devnet faucet directly. The public faucet is often rate-limited; *Open Devnet faucet* opens https://faucet.solana.com with your address copied.
- **ETH**: *Open Sepolia faucet* copies your address and opens a Sepolia faucet (e.g. Google Cloud's). Most faucets want a sign-in.

## Configuration (`.env.local`)

Copy `.env.example` to `.env.local` and fill in what you have. Everything is optional: without it, the app uses public endpoints, which work for testing but are rate-limited.

| Variable | What |
| --- | --- |
| `EXPO_PUBLIC_ETHEREUM_SEPOLIA_RPC_URL` / `EXPO_PUBLIC_ETHEREUM_MAINNET_RPC_URL` | Ethereum RPC (e.g. Alchemy, Infura) |
| `EXPO_PUBLIC_SOLANA_DEVNET_RPC_URL` / `EXPO_PUBLIC_SOLANA_MAINNET_RPC_URL` | Solana RPC (e.g. Helius, QuickNode) |
| `EXPO_PUBLIC_COINGECKO_API_KEY` | CoinGecko Demo API key (free, higher rate limit) |
| `EXPO_PUBLIC_DEFAULT_NETWORK` | `testnet` (default) or `mainnet` for a fresh install |

`EXPO_PUBLIC_*` values are compiled into the app, so anyone with the app can read them. Only use keys you have restricted to this app (allowed domains / app IDs / rate limits). For EAS cloud builds, set the same variables in EAS (`npx eas-cli@latest env:create`), because `.env.local` isn't uploaded.

## Run

The app uses native modules (`react-native-quick-crypto` for fast native crypto, `expo-secure-store`), so it runs in a **development build**, not Expo Go.

```bash
npm install
npm run core:setup    # installs the monorepo root and builds ../packages/wallet-core (rerun after changing wallet-core)
npm run ios           # or: npm run android — builds and installs the dev build (needs Xcode / Android Studio)
npx expo start        # afterwards: start the dev server and open the installed dev build
npm run web           # browser preview (uses the browser's WebCrypto and IndexedDB)
```

Without Xcode or Android Studio, build the dev client in the cloud with EAS (`npx eas-cli@latest build --profile development`); the `eas-build-post-install` script runs `core:setup` there automatically.

Checks: `npx tsc --noEmit` and `npx eslint .` here, and `npm test -w @anthea/wallet-core` in the repo root.

## V1 features (`src/app/`)

| Route | Feature |
| --- | --- |
| `/` | Welcome: create a new wallet or add an existing one |
| `/create` → `/create/backup` → `/create/confirm` | Set a password, write down the seed phrase, confirm three words (or back up later) |
| `/import` | Import from a 12 or 24 word BIP-39 seed phrase and set a password (replaces the wallet on this device) |
| `/unlock` | Password unlock on return visits; restore with seed phrase if the password is forgotten |
| `/home` | Live ETH and SOL balances with USD value, portfolio chart (1H to Max), sent transactions and their status; Send, Receive and Swap |
| `/token?chain=ethereum\|solana` | Token detail: live price and chart, balance, network, Send, Swap, Receive |
| `/send-receive?mode=send\|receive&chain=ethereum\|solana` | Send native ETH/SOL with address, amount and live-fee checks, a review step and an explorer link; Receive shows the address, a QR code, Copy address and (on testnet) faucets |
| `/swap` | Swap preview between ETH and SOL at the market rate, with a size slider and flip button (not live yet) |
| `/settings` | Backup status, network (testnet/mainnet), lock wallet, non-custodial disclosure |
| `/settings/backup` | Password-gated view of the seed phrase and re-confirmation |

Not in the app: buy, token and NFT support, multiple accounts, full transaction history (only transactions sent in the current session are listed) and markets.

## Design tokens

Plain black `#000` background, indigo `#6C5CE7` accent (`#A79BFF` for small accent text), Nunito ExtraBold 800 for UI and Black 900 for headings and figures, tabular numerals on every amount, and 20–30 pt corner radii. See `src/lib/theme.ts`.
