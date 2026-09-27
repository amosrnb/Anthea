# Anthea

Non-custodial crypto wallet for iOS and Android (German UI, dark theme, 390×844 design), built with React Native and
Expo. The binding specification is [`docs/BUILD_PLAN.md`](docs/BUILD_PLAN.md); security model and data flows are in
[`docs/SECURITY.md`](docs/SECURITY.md) and [`docs/PRIVACY.md`](docs/PRIVACY.md).

**Status: Phase 2.** Onboarding, PIN and lock run on the real crypto core (random phrase, encrypted vault, attempt
limit, auto-lock, reveal phrase, change PIN, reset). The receive address and QR code are real (testnets). Balances,
prices, activity and sending are still mock data; the only network access is the Bitcoin address scan on import
(mempool.space testnet4). Do not use this build with real funds.

## Getting started

Requirements: Node 22, and for native builds Xcode (iOS) or Android Studio/SDK (Android) on your machine. Builds run
locally; no Expo account or EAS is needed.

```sh
npm install
npm run ios          # development build on the iOS simulator (expo run:ios)
npm run android      # development build on an Android emulator/device (expo run:android)
npm start            # Metro for an already installed development build
npm run web          # web preview (390×844 frame) for visual checks only
```

Checks (all run in CI):

```sh
npm run typecheck
npm run lint
npm run format:check
npm test
```

End-to-end flows use [Maestro](https://docs.maestro.dev) (CLI, no account) against a running development build:
`npm run e2e`.

## Repository layout

```
app.config.ts         Expo config (app ID is a placeholder until the domain is decided, BUILD_PLAN 13.2)
index.ts              entry point
src/
  App.tsx             device surface, dock, sheets, toast, platform back handling
  useWallet.tsx       all state and derived view values: the interface between logic and screens
  core/               pure crypto and format logic, no I/O (mnemonic, derive, vault, address, amounts)
  platform/           device APIs: secure storage, native crypto
  state/              keyring: vault storage, unlock, withSigner
  dev/                development-build helpers (KDF benchmark in the dev menu)
  data.ts, lib.ts     prototype mock data and helpers (replaced step by step)
  screens/            ported screens, grouped by flow
  ui/                 base components, icons, typography/theme helpers
  __tests__/          Jest + Testing Library
.maestro/             E2E flows
assets/fonts/         Nunito 600–900 (bundled, SIL OFL)
server/               anthea-api, the stateless data proxy (Cloudflare Worker), see server/README.md
prototype/            the original Vite web prototype, kept as visual reference until the port is complete
scripts/              visual comparison of the app with the prototype
docs/                 build plan, security model, privacy, screenshots
project/, chats/      original design source (Claude Design handoff, see below)
```

## Visual comparison with the prototype

`scripts/visual-compare.mjs` drives the prototype and the app's web build through the same click paths at 390×844 and
writes side-by-side screenshots to `docs/screenshots/phase-0/`:

```sh
npx expo export -p web --output-dir dist
(cd prototype && npm ci && npx vite build)
node scripts/visual-compare.mjs                     # optional: --diff <dir> for pixel diffs, --only <names>
```

---

# Design handoff bundle

The sections below come from the Claude Design handoff and describe the design source in `project/` and `chats/`.

This is a **handoff bundle** from Claude Design (claude.ai/design).

A user mocked up designs in HTML/CSS/JS using an AI design tool, then exported this bundle so a coding agent can implement the designs for real.

## What you should do — IMPORTANT

**Read the chat transcripts first.** There are 3 chat transcript(s) in `chats/`. The transcripts show the full back-and-forth between the user and the design assistant — they tell you **what the user actually wants** and **where they landed** after iterating. Don't skip them. The final HTML files are the output, but the chat is where the intent lives.

**Read `project/Anthea Wallet.dc.html` in full.** The user had this file open when they triggered the handoff, so it's almost certainly the primary design they want built. Read it top to bottom — don't skim. Then **follow its imports**: open every file it pulls in (shared components, CSS, scripts) so you understand how the pieces fit together before you start implementing.

**If anything is ambiguous, ask the user to confirm before you start implementing.** It's much cheaper to clarify scope up front than to build the wrong thing.

## About the design files

The design medium is **HTML/CSS/JS** — these are prototypes, not production code. Your job is to **recreate them pixel-perfectly** in whatever technology makes sense for the target codebase (React, Vue, native, whatever fits). Match the visual output; don't copy the prototype's internal structure unless it happens to fit.

**Don't render these files in a browser or take screenshots unless the user asks you to.** Everything you need — dimensions, colors, layout rules — is spelled out in the source. Read the HTML and CSS directly; a screenshot won't tell you anything they don't.

## Bundle contents

- `README.md` — this file
- `chats/` — conversation transcripts (read these!)
- `project/` — the `Valid 3` project files (HTML prototypes, assets, components)
