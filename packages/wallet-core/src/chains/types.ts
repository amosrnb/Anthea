/**
 * Shared per-chain adapter contract. Each supported chain implements this
 * with its own curve/derivation/RPC client — deliberately not a single
 * shared EVM-style client, since Ethereum and Solana differ in curve,
 * address format, and transaction model.
 */

export type ChainId = "ethereum" | "solana";

export const CHAIN_IDS: readonly ChainId[] = ["ethereum", "solana"];

export function isChainId(value: string): value is ChainId {
  return (CHAIN_IDS as readonly string[]).includes(value);
}

/**
 * Which network to talk to. `testnet` is Ethereum Sepolia and Solana Devnet:
 * same keys and addresses as mainnet, but the coins are free and worthless.
 */
export type Network = "mainnet" | "testnet";

export const NETWORKS: readonly Network[] = ["mainnet", "testnet"];

export interface RpcConfig {
  /** Network to use. Defaults to `mainnet`. */
  network?: Network;
  /** Custom RPC URL (e.g. Alchemy/Infura/a Solana RPC provider) for that network. Falls back to a public default if omitted. */
  rpcUrl?: string;
}

/** Where a submitted transaction stands. `failed` means it was included but reverted/errored. */
export type TransactionStatus = "pending" | "confirmed" | "failed";

export interface ChainAccount {
  readonly chainId: ChainId;
  readonly address: string;
  /** Sign an arbitrary message client-side without broadcasting anything. Returns a chain-appropriate encoded signature. */
  signMessage(message: string): Promise<string>;
  /** Native asset balance (ETH / SOL) as a human-readable decimal string. */
  getNativeBalance(config?: RpcConfig): Promise<string>;
  /**
   * Estimated network fee for sending the native asset to `to`, as a
   * human-readable decimal string. For Ethereum this is the maximum the
   * transaction can cost (gas limit × max fee per gas); the actual fee is
   * usually lower.
   */
  estimateNativeFee(to: string, amount: string, config?: RpcConfig): Promise<string>;
  /**
   * Sign and submit a native-asset transfer. `amount` is a human-readable
   * decimal string, e.g. "0.01". Resolves with the tx hash/signature once the
   * network has accepted it; use `getTransactionStatus` to follow it.
   */
  sendNative(to: string, amount: string, config?: RpcConfig): Promise<string>;
  /** Status of a transaction previously returned by `sendNative`. */
  getTransactionStatus(hash: string, config?: RpcConfig): Promise<TransactionStatus>;
}
