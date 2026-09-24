# Anthea Wallet — frontend prototype

React + TypeScript (Vite) implementation of `project/Anthea Wallet.dc.html`: a 390×844 German-language self-custody wallet prototype. Everything runs client-side with mock data and no backend.

```sh
npm install
npm run dev        # http://localhost:5173
npm run build      # typecheck + production build to dist/
```

The design's tweak props are URL params: `?start=welcome|lock|home`, `?testnet=0` hides the TESTNETZ badge, and `?privacy=1` blurs balances. The 6-digit PIN set during onboarding unlocks the app, confirms transactions and protects the seed-phrase view. If you skip onboarding via `?start=`, any 6 digits are accepted.

Layout of `src/`:
- `data.ts`: assets, coins, addresses, fees and seed words (ported verbatim from the prototype)
- `lib.ts`: formatting, chart paths, QR matrix and recipient-address checks
- `useWallet.tsx`: all state and derived view values (the prototype's `Component` class / `renderVals`)
- `screens/`: one component per screen, grouped by flow; `App.tsx` holds the device chrome, dock and overlays

---

# CODING AGENTS: READ THIS FIRST

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
