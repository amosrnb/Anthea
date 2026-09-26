# Anthea Wallet — web prototype (reference only)

The original React + Vite prototype of `project/Anthea Wallet.dc.html`. It is kept as the visual reference for the React Native port (see `docs/BUILD_PLAN.md`, section 4.1) and is archived once the port is complete. Do not add features here.

```sh
cd prototype
npm install
npm run dev        # http://localhost:5173
```

Tweak props are URL params: `?start=welcome|lock|home`, `?testnet=0` hides the TESTNETZ badge, and `?privacy=1` blurs balances. If you skip onboarding via `?start=`, any 6 digits are accepted as PIN.
