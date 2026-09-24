# @anthea/wallet-core

Anthea's non-custodial wallet core (ANT-3). Key generation/import, encrypted
local key storage, client-side signing, and direct on-chain RPC reads/writes
— no backend in the transaction path.

Built per the corrected Anthea V1 Technical Scope (ANT-2, revised
2026-09-20): TypeScript, **Ethereum + Solana** (two different curves —
secp256k1 via viem, ed25519 via `@noble/curves` with RPC via `@solana/web3.js`), BIP39/BIP44
(`m/44'/60'/0'/0/{account}` for Ethereum, `m/44'/501'/{account}'/0'` for
Solana), IndexedDB + PBKDF2/AES-GCM encrypted storage, and **multi-wallet /
multi-account** support. Native asset only for V1 (ETH, SOL) — no ERC-20/SPL
token support.

## Security model

- Private keys/mnemonics never leave the client and are never sent to any
  Anthea-operated server. Chain reads/writes go straight from the client to
  the configured RPC endpoint.
- A mnemonic is only ever held in plaintext in memory, inside an unlocked
  `Wallet` instance's closure. At rest, every wallet's mnemonic is stored in
  one vault encrypted with a key derived from the user's password via
  PBKDF2-SHA256 (600,000 iterations) and AES-256-GCM, using only the
  platform Web Crypto API — no bespoke crypto.
- Persisted as a single ciphertext blob plus its (non-secret)
  salt/IV/iteration count. Browsers use IndexedDB (not `localStorage`),
  origin-isolated, by default; other platforms plug in their own store with
  `setVaultStorage()` (the Expo app uses the iOS Keychain / Android Keystore).
- Runs anywhere with a standard `globalThis.crypto` (WebCrypto): browsers,
  Node, and React Native with a native WebCrypto such as
  `react-native-quick-crypto` installed before this package is loaded.
- Sends validate the recipient address and a positive amount before any
  signing happens, on both chains.
- `WalletManager.createWallet()` / `Wallet.generate()` expose the raw
  mnemonic only at creation time, for the caller to show the user for
  backup — the vault only ever stores it encrypted.

## Architecture

- **One mnemonic → one `Wallet`.** A `Wallet` derives per-account keypairs
  lazily: `wallet.account(0)` returns a `WalletAccount` holding both an
  `EthereumAccount` and a `SolanaAccount` derived from the same seed at that
  BIP44 account index. Ethereum's secp256k1 HD derivation cannot be reused
  for Solana's ed25519 (SLIP-0010 requires fully-hardened paths for
  ed25519), so each chain has its own adapter under `src/chains/`.
- **`WalletManager` → multiple independent wallets.** One password-protected
  vault on a device can hold several separate mnemonics (e.g. "Main",
  "Savings"), each with its own multi-account tree. This is the
  multi-wallet/multi-account support required by V1 scope.
- **Chain adapters implement `ChainAccount`** (`src/chains/types.ts`):
  `address`, `signMessage`, `getNativeBalance`, `sendNative` — a small,
  uniform surface so the frontend doesn't need per-chain branching for basic
  operations.

## Usage

```ts
import { WalletManager } from "@anthea/wallet-core";

// First run: create the on-device vault
const manager = await WalletManager.initialize(password);

// Create a new wallet (mnemonic returned once, for backup)
const { id, wallet } = await manager.createWallet("Main");
// Show `wallet.mnemonic` to the user once, then discard it from your own state.

// Or import an existing mnemonic as a new wallet
const { id, wallet } = await manager.importWallet("Imported", mnemonic);

// Later sessions: unlock with the password only
const manager = await WalletManager.unlock(password);
manager.list(); // [{ id, name, createdAt }, ...]
const wallet = manager.getWallet(id);

const account = wallet.account(0); // account index 0 (multi-account: pass 1, 2, ... for more)
account.ethereum.address; // "0x..."
account.solana.address; // base58 address

await account.ethereum.getNativeBalance(); // "0.42" (ETH)
await account.solana.getNativeBalance(); // "1.5" (SOL)

await account.ethereum.estimateNativeFee("0xRecipient...", "0.01"); // max fee, e.g. "0.000046"
const hash = await account.ethereum.sendNative("0xRecipient...", "0.01");
await account.ethereum.getTransactionStatus(hash); // "pending" | "confirmed" | "failed"
await account.solana.sendNative("RecipientBase58...", "0.1");
```

### Networks and RPC endpoints

Every RPC method takes an optional `RpcConfig`:

- `network: "mainnet" | "testnet"` (default `mainnet`). `testnet` is Ethereum
  **Sepolia** and Solana **Devnet**: same keys and addresses, free test coins.
- `rpcUrl`: a dedicated endpoint for that network (Alchemy/Infura for
  Ethereum, Helius/QuickNode/… for Solana). Without it, a rate-limited public
  endpoint is used, which is fine for testing but not for real traffic.

```ts
const testnet = { network: "testnet" } as const;
await account.solana.getNativeBalance(testnet);
await account.solana.requestTestnetAirdrop("1", testnet); // Devnet faucet, often rate-limited
explorerTxUrl("solana", signature, "testnet"); // Solana Explorer link, ?cluster=devnet
```

`sendNative` resolves as soon as the network accepts the transaction (it
has been signed locally and passed the node's checks); follow it with
`getTransactionStatus`. On Solana, a first transfer to an empty address below
the rent-exempt minimum (~0.00089 SOL) is refused up front, since the network
would reject it.

### Locking

There is currently no in-memory "lock" — a `WalletManager`/`Wallet` instance
simply holds decrypted state for its lifetime; the frontend should drop its
reference (e.g. on logout/tab close) rather than calling a `lock()` method,
since none exists yet. `WalletManager.unlock(password)` always re-derives
from the encrypted vault. `WalletManager.removeWallet(id)` removes one
wallet; `WalletManager.removeAll()` deletes the entire on-device vault
(neither affects on-chain funds).

## API surface

See `src/index.ts` for the full exported surface: `WalletManager`, `Wallet`,
`WalletAccount`, `generateMnemonic`/`validateMnemonic`/`mnemonicToSeed`,
the `chains/ethereum.ts` and `chains/solana.ts` adapters
(`EthereumAccount`/`SolanaAccount`, `deriveEthereumAccount`/
`deriveSolanaKeypair`), and the shared `ChainAccount`/`ChainId` contract in
`chains/types.ts`.

## Development

```sh
npm install
npm run typecheck --workspace=@anthea/wallet-core
npm run test --workspace=@anthea/wallet-core
npm run build --workspace=@anthea/wallet-core
```

Tests use `vitest` with `fake-indexeddb`. No real browser or live RPC is
needed: `test/chains/rpc.test.ts` runs balance, fee, send and status calls
against a stubbed JSON-RPC endpoint, and checks the signed transactions
(chain ID, recipient, amount, signature) and which endpoint each network hits.

Key derivation and signing are pure JS (`@noble/*`, `@scure/*`) and need no
Node built-ins. `@solana/web3.js` is loaded lazily, only for Solana RPC calls
(balance, fee, send, status, airdrop); in a browser it still expects a `Buffer`
polyfill (e.g. `vite-plugin-node-polyfills`, as `packages/web` does).
