# Anthea V1 — Frontend Prototype Prompt (ANTA-15)

This is the working prompt for building out Anthea's V1 frontend prototype.
It extends the original task description with a definition of the V1 "basic
feature set", so that "add features, or remove them if they don't belong to
the basic features of v1" has a concrete list to check against.

## Original instruction

> Füge Features hinzu oder entferne sie, wenn sie nicht zu den Basic Features
> von v1 gehören. Es soll erstmal kein Backend dran gebaut werden. Ändere
> nichts am Frontend, außer den Sachen, die gerade beschrieben wurden. Push
> anschließend auf GitHub.

(No guidance on visual design/styling is given here on purpose — this prompt
is scoped to *which* features exist, not how the frontend looks or is laid
out. Existing styling/design must not change as part of this.)

## What Anthea is

Anthea is a non-custodial, multi-chain crypto wallet. Keys are generated and
held on-device; there is no backend or custodial service in the transaction
path.

## Basic features (V1)

1. **Onboarding** — create a new wallet (generate a mnemonic, set a password
   to encrypt the local vault) or import an existing wallet from a mnemonic.
   Creating a wallet includes a mnemonic backup + confirmation step.
2. **Unlock** — password-based unlock of the local encrypted vault on return
   visits.
3. **Balances** — overview of native asset balances (ETH, SOL) and their USD
   value.
4. **Send** — send native ETH or SOL to a recipient address, with a
   review/confirm step before the transaction goes out.
5. **Receive** — show the wallet's address (with QR code) for receiving
   funds.
6. **Backup & Recovery** — view/re-confirm the mnemonic seed phrase at any
   time from Settings.
7. **Settings** — lock the wallet, see backup status, basic non-custodial
   disclosure.

## Explicitly out of scope for V1

- Swap / exchange between assets (needs a real swap or RPC provider — no
  backend yet, so this doesn't fit V1).
- Any token support beyond native assets (no ERC-20 / SPL tokens).
- Fiat conversion beyond a simple USD-equivalent display.
- Transaction history, contacts/address book, push notifications, staking,
  NFTs, buy/on-ramp, dApp browser, bridging.
- A backend of any kind, or live RPC/network calls — balances, prices, and
  broadcast confirmation stay mocked (`packages/web/src/lib/mock.ts`) for
  this prototype.

## Constraints

- Frontend prototype only. No backend work in this pass.
- Don't change how the frontend is designed/styled — only add or remove
  features so the app's scope matches the list above.
- Push the result to GitHub: https://github.com/amosrnb/Anthea.git

## Audit result (2026-09-23)

Checked the current prototype (`packages/web`) against the list above:
onboarding, unlock, balances, send, receive, backup & recovery, and settings
are implemented; Swap was already removed from routes/nav/mocks in an
earlier pass (commit `a86757c`). No out-of-scope features (tokens, history,
contacts, notifications, staking, NFTs, buy, dApp browser, bridging) are
present. No feature changes were required as a result of this pass.
