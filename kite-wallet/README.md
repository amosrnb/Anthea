# Anthea

Frontend-only mobile prototype of Anthea, a non-custodial multi-chain wallet (Ethereum and Solana), built with Expo (SDK 57), Expo Router and TypeScript. The visual design comes from the Claude Design handoff in `../project/`.

There is no backend and no network access. The seed phrase is a demo phrase, the vault only stores a password fingerprint (no real encryption), and balances, prices, swap rates, chart history, fees and transaction broadcast are simulated in `src/lib/data.ts`.

## Run

```bash
npm install
npx expo start        # scan the QR code with Expo Go, or press i / a for a simulator
npm run web           # browser preview
```

Checks: `npx tsc --noEmit` and `npx eslint .`

## V1 features (`src/app/`)

| Route | Feature |
| --- | --- |
| `/` | Welcome: create a new wallet or add an existing one |
| `/create` → `/create/backup` → `/create/confirm` | Set a password, write down the seed phrase, confirm three words (or back up later) |
| `/import` | Import from a 12 or 24 word seed phrase and set a password |
| `/unlock` | Password unlock on return visits; restore with seed phrase if the password is forgotten |
| `/home` | ETH and SOL balances with USD value, portfolio chart (1H to Max); Send, Receive and Swap |
| `/send-receive?mode=send\|receive&chain=ethereum\|solana` | Send native ETH/SOL with address and amount checks and a review step; Receive shows the address, a QR code and Copy address |
| `/swap` | Swap between ETH and SOL with a size slider, flip button and mocked rate |
| `/settings` | Backup status, lock wallet, non-custodial disclosure |
| `/settings/backup` | Password-gated view of the seed phrase and re-confirmation |

Not in the app: buy, token and NFT support, multiple accounts, transaction history and markets. Swap and the portfolio chart were kept at the owner's request; both are simulated.

## Design tokens

Plain black `#000` background, indigo `#6C5CE7` accent (`#A79BFF` for small accent text), Nunito ExtraBold 800 for UI and Black 900 for headings and figures, tabular numerals on every amount, and 20–30 pt corner radii. See `src/lib/theme.ts`.
