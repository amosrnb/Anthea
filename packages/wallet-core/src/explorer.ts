import { ethereumExplorerTxUrl } from "./chains/ethereum.js";
import { solanaExplorerTxUrl } from "./chains/solana.js";
import type { ChainId, Network } from "./chains/types.js";

/** Block explorer link (Etherscan / Solana Explorer) for a transaction on `network`. */
export function explorerTxUrl(chainId: ChainId, hash: string, network: Network = "mainnet"): string {
  return chainId === "ethereum" ? ethereumExplorerTxUrl(hash, network) : solanaExplorerTxUrl(hash, network);
}
