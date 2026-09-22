import type { ChainId } from "@anthea/wallet-core";

export interface ChainMeta {
  id: ChainId;
  label: string;
  symbol: string;
  color: string;
  explorerTxUrl: (hash: string) => string;
  explorerAddressUrl: (address: string) => string;
}

export const CHAIN_META: Record<ChainId, ChainMeta> = {
  ethereum: {
    id: "ethereum",
    label: "Ethereum",
    symbol: "ETH",
    color: "var(--color-ethereum)",
    explorerTxUrl: (hash) => `https://etherscan.io/tx/${hash}`,
    explorerAddressUrl: (address) => `https://etherscan.io/address/${address}`,
  },
  solana: {
    id: "solana",
    label: "Solana",
    symbol: "SOL",
    color: "var(--color-solana)",
    explorerTxUrl: (hash) => `https://solscan.io/tx/${hash}`,
    explorerAddressUrl: (address) => `https://solscan.io/account/${address}`,
  },
};

export const CHAIN_ORDER: ChainId[] = ["ethereum", "solana"];
