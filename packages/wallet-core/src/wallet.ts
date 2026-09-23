/**
 * One unlocked mnemonic, with lazily-derived per-account keypairs.
 *
 * A single mnemonic backs both an Ethereum and a Solana keypair per account
 * index (multi-account: standard BIP44 account-index increments). Multiple
 * independent `Wallet`s (separate mnemonics) are managed by `WalletManager`.
 */
import { deriveEthereumAccount, EthereumAccount } from "./chains/ethereum.js";
import { deriveSolanaKeypair, SolanaAccount } from "./chains/solana.js";
import type { ChainAccount, ChainId } from "./chains/types.js";
import { type MnemonicStrength, generateMnemonic, validateMnemonic } from "./mnemonic.js";

export class WalletAccount {
  readonly accountIndex: number;
  readonly ethereum: EthereumAccount;
  readonly solana: SolanaAccount;

  constructor(mnemonic: string, accountIndex: number) {
    this.accountIndex = accountIndex;
    this.ethereum = new EthereumAccount(deriveEthereumAccount(mnemonic, accountIndex));
    this.solana = new SolanaAccount(deriveSolanaKeypair(mnemonic, accountIndex));
  }

  chain(chainId: ChainId): ChainAccount {
    return chainId === "ethereum" ? this.ethereum : this.solana;
  }
}

export class Wallet {
  readonly #mnemonic: string;
  readonly #accounts = new Map<number, WalletAccount>();

  constructor(mnemonic: string) {
    if (!validateMnemonic(mnemonic)) {
      throw new Error("Invalid mnemonic");
    }
    this.#mnemonic = mnemonic;
  }

  /** Generate a brand-new wallet backed by a fresh BIP39 mnemonic. */
  static generate(strength: MnemonicStrength = 128): Wallet {
    return new Wallet(generateMnemonic(strength));
  }

  /**
   * The raw mnemonic. Callers should only surface this to the user once,
   * immediately after creation, for backup — never persist it themselves;
   * `WalletManager` already persists it encrypted.
   */
  get mnemonic(): string {
    return this.#mnemonic;
  }

  /** Get (deriving and caching on first access) the account at `accountIndex`. Defaults to the first account. */
  account(accountIndex = 0): WalletAccount {
    let account = this.#accounts.get(accountIndex);
    if (!account) {
      account = new WalletAccount(this.#mnemonic, accountIndex);
      this.#accounts.set(accountIndex, account);
    }
    return account;
  }
}
