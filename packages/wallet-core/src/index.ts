export { generateMnemonic, normalizeMnemonic, validateMnemonic, mnemonicToSeed } from "./mnemonic.js";
export type { MnemonicStrength } from "./mnemonic.js";

export { Wallet, WalletAccount } from "./wallet.js";
export { WalletManager } from "./wallet-manager.js";
export type { WalletSummary } from "./wallet-manager.js";

export { keystoreExists } from "./keystore.js";
export { setVaultStorage } from "./storage/storage.js";
export type { VaultStorage } from "./storage/storage.js";

export {
  EthereumAccount,
  deriveEthereumAccount,
  ethereumDerivationPath,
  ETHEREUM_DECIMALS,
  ETHEREUM_SEPOLIA_DEFAULT_RPC,
  ethereumChain,
  ethereumExplorerTxUrl,
} from "./chains/ethereum.js";
export {
  SolanaAccount,
  deriveSolanaKeypair,
  solanaDerivationPath,
  SOLANA_DECIMALS,
  SOLANA_DEFAULT_RPC,
  SOLANA_DEVNET_RPC,
  solanaDefaultRpc,
  solanaExplorerTxUrl,
} from "./chains/solana.js";
export type { SolanaKeypair } from "./chains/solana.js";
export { CHAIN_IDS, NETWORKS, isChainId } from "./chains/types.js";
export type { ChainAccount, ChainId, Network, RpcConfig, TransactionStatus } from "./chains/types.js";
export { explorerTxUrl } from "./explorer.js";

// Exact decimal <-> base-unit conversion (wei, lamports) for callers doing balance math.
export { formatUnits, parseUnits } from "viem";

export type { EncryptedPayload } from "./crypto.js";
