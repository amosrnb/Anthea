/**
 * Ethereum chain adapter (Mainnet, or Sepolia for testing): secp256k1, BIP44
 * path m/44'/60'/0'/0/{account}. Direct client-to-RPC access via viem — no
 * Anthea backend in the path.
 */
import {
  type Address,
  type Hash,
  type LocalAccount,
  createPublicClient,
  createWalletClient,
  formatUnits,
  http,
  isAddress,
  isHash,
  parseUnits,
} from "viem";
import { mainnet, sepolia } from "viem/chains";
import { mnemonicToAccount } from "viem/accounts";
import { normalizeMnemonic, validateMnemonic } from "../mnemonic.js";
import type { ChainAccount, Network, RpcConfig, TransactionStatus } from "./types.js";

export const ETHEREUM_DECIMALS = 18;

/** Public Sepolia endpoint (viem's built-in default is rate-limited). Pass `rpcUrl` for production use. */
export const ETHEREUM_SEPOLIA_DEFAULT_RPC = "https://ethereum-sepolia-rpc.publicnode.com";

/** Gas used by a plain ETH transfer to an externally owned account. */
const TRANSFER_GAS = 21_000n;

export function ethereumDerivationPath(accountIndex: number): string {
  return `m/44'/60'/0'/0/${accountIndex}`;
}

/** The viem chain for a network: Ethereum Mainnet, or Sepolia for `testnet`. */
export function ethereumChain(network: Network = "mainnet") {
  return network === "testnet" ? sepolia : mainnet;
}

/** Block explorer link for a transaction hash. */
export function ethereumExplorerTxUrl(hash: string, network: Network = "mainnet"): string {
  return `${network === "testnet" ? "https://sepolia.etherscan.io" : "https://etherscan.io"}/tx/${hash}`;
}

function transportFor(config?: RpcConfig) {
  if (config?.rpcUrl) return http(config.rpcUrl);
  return config?.network === "testnet" ? http(ETHEREUM_SEPOLIA_DEFAULT_RPC) : http();
}

function publicClientFor(config?: RpcConfig) {
  return createPublicClient({ chain: ethereumChain(config?.network), transport: transportFor(config) });
}

function assertValidAddress(address: string): asserts address is Address {
  if (!isAddress(address)) {
    throw new Error(`Invalid Ethereum address: ${address}`);
  }
}

function parsePositiveAmount(amount: string): bigint {
  const value = parseUnits(amount, ETHEREUM_DECIMALS);
  if (value <= 0n) {
    throw new Error("Amount must be greater than zero");
  }
  return value;
}

/** Derive the BIP44 account at m/44'/60'/0'/0/{accountIndex}. */
export function deriveEthereumAccount(mnemonic: string, accountIndex: number): LocalAccount {
  if (!validateMnemonic(mnemonic)) {
    throw new Error("Invalid mnemonic");
  }
  return mnemonicToAccount(normalizeMnemonic(mnemonic), {
    accountIndex,
    addressIndex: 0,
    changeIndex: 0,
  });
}

export class EthereumAccount implements ChainAccount {
  readonly chainId = "ethereum" as const;
  readonly #account: LocalAccount;

  constructor(account: LocalAccount) {
    this.#account = account;
  }

  get address(): Address {
    return this.#account.address;
  }

  /** Sign an arbitrary message (EIP-191) without broadcasting anything. Private key never leaves this closure. */
  async signMessage(message: string): Promise<Hash> {
    return this.#account.signMessage({ message });
  }

  async getNativeBalance(config?: RpcConfig): Promise<string> {
    const raw = await publicClientFor(config).getBalance({ address: this.address });
    return formatUnits(raw, ETHEREUM_DECIMALS);
  }

  async estimateNativeFee(to: string, amount: string, config?: RpcConfig): Promise<string> {
    assertValidAddress(to);
    const value = parsePositiveAmount(amount);
    const client = publicClientFor(config);
    const [fees, gas] = await Promise.all([
      client.estimateFeesPerGas(),
      // A contract recipient can need more than a plain transfer. Estimation
      // fails when the balance can't cover `value`; the plain-transfer figure
      // is right for the usual (EOA) case then, and the send itself re-checks.
      client.estimateGas({ account: this.address, to, value }).catch(() => TRANSFER_GAS),
    ]);
    return formatUnits(gas * fees.maxFeePerGas, ETHEREUM_DECIMALS);
  }

  async sendNative(to: string, amount: string, config?: RpcConfig): Promise<Hash> {
    assertValidAddress(to);
    const value = parsePositiveAmount(amount);
    const chain = ethereumChain(config?.network);
    const walletClient = createWalletClient({
      account: this.#account,
      chain,
      transport: transportFor(config),
    });
    return walletClient.sendTransaction({ to, value, chain });
  }

  async getTransactionStatus(hash: string, config?: RpcConfig): Promise<TransactionStatus> {
    if (!isHash(hash)) {
      throw new Error(`Invalid Ethereum transaction hash: ${hash}`);
    }
    try {
      const receipt = await publicClientFor(config).getTransactionReceipt({ hash });
      return receipt.status === "success" ? "confirmed" : "failed";
    } catch (error) {
      // No receipt yet: the transaction hasn't been mined.
      if (error instanceof Error && error.name === "TransactionReceiptNotFoundError") return "pending";
      throw error;
    }
  }
}
