export { generateMnemonic, normalizeMnemonic, validateMnemonic, mnemonicToSeed } from "./mnemonic.js";
export type { MnemonicStrength } from "./mnemonic.js";

export { Wallet, WalletAccount } from "./wallet.js";
export { WalletManager } from "./wallet-manager.js";
export type { WalletSummary } from "./wallet-manager.js";

export { keystoreExists } from "./keystore.js";

export {
  EthereumAccount,
  deriveEthereumAccount,
  ethereumDerivationPath,
  ETHEREUM_DECIMALS,
} from "./chains/ethereum.js";
export {
  SolanaAccount,
  deriveSolanaKeypair,
  solanaDerivationPath,
  SOLANA_DECIMALS,
  SOLANA_DEFAULT_RPC,
} from "./chains/solana.js";
export { CHAIN_IDS, isChainId } from "./chains/types.js";
export type { ChainAccount, ChainId, RpcConfig } from "./chains/types.js";

export type { EncryptedPayload } from "./crypto.js";
