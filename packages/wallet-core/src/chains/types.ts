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

export interface RpcConfig {
  /** Custom RPC URL (e.g. Alchemy/Infura/a Solana RPC provider). Falls back to a public default if omitted. */
  rpcUrl?: string;
}

export interface ChainAccount {
  readonly chainId: ChainId;
  readonly address: string;
  /** Sign an arbitrary message client-side without broadcasting anything. Returns a chain-appropriate encoded signature. */
  signMessage(message: string): Promise<string>;
  /** Native asset balance (ETH / SOL) as a human-readable decimal string. */
  getNativeBalance(config?: RpcConfig): Promise<string>;
  /** Send the native asset. `amount` is a human-readable decimal string, e.g. "0.01". Returns the tx signature/hash. */
  sendNative(to: string, amount: string, config?: RpcConfig): Promise<string>;
}
