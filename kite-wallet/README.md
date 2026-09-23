# Anthea

Mobile app of Anthea, a non-custodial multi-chain wallet (Ethereum and Solana), built with Expo (SDK 57), Expo Router and TypeScript. The visual design comes from the Claude Design handoff in `../project/`.

## What is real and what is simulated

**Real** (via [`@anthea/wallet-core`](../packages/wallet-core)): the seed phrase is generated on the device from secure randomness (BIP-39), addresses are derived from it (Ethereum `m/44'/60'/0'/0/0`, Solana `m/44'/501'/0'/0'`, the same as MetaMask and Phantom), and the vault is encrypted with the password (PBKDF2-SHA256, 600,000 iterations + AES-256-GCM). On iOS/Android the encrypted vault is also kept in the Keychain/Keystore, device-only. Import only accepts valid BIP-39 phrases, and Receive shows the real address and a real, scannable QR code.

**Simulated** (no backend and no network access yet): balances, prices, swap rates, chart history, fees and transaction broadcast, all in `src/lib/data.ts`. Real funds sent to a Receive address are safe (the keys are real and the seed phrase restores them in any standard wallet) but won't show in the app yet.

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

Checks: `npx tsc --noEmit` and `npx eslint .`

## V1 features (`src/app/`)

| Route | Feature |
| --- | --- |
| `/` | Welcome: create a new wallet or add an existing one |
| `/create` → `/create/backup` → `/create/confirm` | Set a password, write down the seed phrase, confirm three words (or back up later) |
| `/import` | Import from a 12 or 24 word BIP-39 seed phrase and set a password (replaces the wallet on this device) |
| `/unlock` | Password unlock on return visits; restore with seed phrase if the password is forgotten |
| `/home` | ETH and SOL balances with USD value, portfolio chart (1H to Max); Send, Receive and Swap |
| `/token?chain=ethereum\|solana` | Token detail: price chart (simulated), balance, Send, Swap, Receive |
| `/send-receive?mode=send\|receive&chain=ethereum\|solana` | Send native ETH/SOL with address and amount checks and a review step; Receive shows the address, a QR code and Copy address |
| `/swap` | Swap between ETH and SOL with a size slider, flip button and mocked rate |
| `/settings` | Backup status, lock wallet, non-custodial disclosure |
| `/settings/backup` | Password-gated view of the seed phrase and re-confirmation |

Not in the app: buy, token and NFT support, multiple accounts, transaction history and markets. Swap and the portfolio chart were kept at the owner's request; both are simulated.

## Design tokens

Plain black `#000` background, indigo `#6C5CE7` accent (`#A79BFF` for small accent text), Nunito ExtraBold 800 for UI and Black 900 for headings and figures, tabular numerals on every amount, and 20–30 pt corner radii. See `src/lib/theme.ts`.
