/**
 * Ethereum Mainnet chain adapter: secp256k1, BIP44 path m/44'/60'/0'/0/{account}.
 * Direct client-to-RPC access via viem — no Anthea backend in the path.
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
  parseUnits,
} from "viem";
import { mainnet } from "viem/chains";
import { mnemonicToAccount } from "viem/accounts";
import { normalizeMnemonic, validateMnemonic } from "../mnemonic.js";
import type { ChainAccount, RpcConfig } from "./types.js";

export const ETHEREUM_DECIMALS = 18;

export function ethereumDerivationPath(accountIndex: number): string {
  return `m/44'/60'/0'/0/${accountIndex}`;
}

function transportFor(config?: RpcConfig) {
  return config?.rpcUrl ? http(config.rpcUrl) : http();
}

function assertValidAddress(address: string): asserts address is Address {
  if (!isAddress(address)) {
    throw new Error(`Invalid Ethereum address: ${address}`);
  }
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
    const client = createPublicClient({ chain: mainnet, transport: transportFor(config) });
    const raw = await client.getBalance({ address: this.address });
    return formatUnits(raw, ETHEREUM_DECIMALS);
  }

  async sendNative(to: string, amount: string, config?: RpcConfig): Promise<Hash> {
    assertValidAddress(to);
    const value = parseUnits(amount, ETHEREUM_DECIMALS);
    if (value <= 0n) {
      throw new Error("Amount must be greater than zero");
    }
    const walletClient = createWalletClient({
      account: this.#account,
      chain: mainnet,
      transport: transportFor(config),
    });
    return walletClient.sendTransaction({ to, value, chain: mainnet });
  }
}
