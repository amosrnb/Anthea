# Kite Wallet

Frontend-only mobile prototype of the Kite crypto wallet, built with Expo (SDK 57), Expo Router and TypeScript from the Claude Design handoff in `../project/Kite Wallet.dc.html`. There is no backend; balances, holdings and wallets are sample data, and actions confirm with a toast.

## Run

```bash
npm install
npx expo start        # scan the QR code with Expo Go, or press i / a for a simulator
npm run web           # browser preview
```

Checks: `npx tsc --noEmit` and `npx eslint .`

## Screens (`src/app/`)

| Route | Screen |
| --- | --- |
| `/` | Onboarding: floating hero, "Create a new wallet", and the "Add an existing wallet" sheet |
| `/home` | Balance, range chart, Send / Receive / Buy / Swap actions, holdings filter, glass dock |
| `/swap` | USDC → WBTC with a draggable size slider and percentage chips |
| `/send-receive?mode=send\|receive` | Collectible picker for Send; QR code and address for Receive |
| `/accounts` | Wallet switcher; picking a wallet updates the Home account chip |

## Design tokens

Plain black `#000` background, indigo `#6C5CE7` accent (`#A79BFF` for small accent text), Nunito ExtraBold 800 for UI and Black 900 for headings and figures, tabular numerals on every amount, and 20–30 pt corner radii. See `src/lib/theme.ts`.

## Placeholders

The NFT tiles, token marks and onboarding shapes are placeholder art from the design. The QR code is decorative and does not encode the address.
