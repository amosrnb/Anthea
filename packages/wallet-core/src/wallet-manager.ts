/**
 * Multi-wallet management: one password-protected vault on this device can
 * hold several independent wallets (separate mnemonics), each exposing
 * multiple accounts (see `Wallet`/`WalletAccount`).
 */
import {
  type WalletEntry,
  createVault,
  deleteVault,
  keystoreExists,
  readVault,
  writeVault,
} from "./keystore.js";
import { type MnemonicStrength, validateMnemonic } from "./mnemonic.js";
import { Wallet } from "./wallet.js";

export interface WalletSummary {
  id: string;
  name: string;
  createdAt: number;
}

function toSummary(entry: WalletEntry): WalletSummary {
  return { id: entry.id, name: entry.name, createdAt: entry.createdAt };
}

export class WalletManager {
  #password: string;
  #wallets: WalletEntry[];

  private constructor(password: string, wallets: WalletEntry[]) {
    this.#password = password;
    this.#wallets = wallets;
  }

  /** Whether a vault already exists on this device. */
  static async exists(): Promise<boolean> {
    return keystoreExists();
  }

  /** Create a brand-new, empty vault protected by `password`. Throws if one already exists. */
  static async initialize(password: string): Promise<WalletManager> {
    const contents = await createVault(password);
    return new WalletManager(password, contents.wallets);
  }

  /** Decrypt the vault with `password`. Throws if none exists or the password is wrong. */
  static async unlock(password: string): Promise<WalletManager> {
    const contents = await readVault(password);
    return new WalletManager(password, contents.wallets);
  }

  /** Permanently delete the vault and every wallet in it from this device (does not affect on-chain funds). */
  static async removeAll(): Promise<void> {
    await deleteVault();
  }

  async #persist(): Promise<void> {
    await writeVault({ version: 1, wallets: this.#wallets }, this.#password);
  }

  /** List wallet metadata only — does not derive any keys. */
  list(): WalletSummary[] {
    return this.#wallets.map(toSummary);
  }

  #findEntry(id: string): WalletEntry {
    const entry = this.#wallets.find((wallet) => wallet.id === id);
    if (!entry) {
      throw new Error(`Wallet not found: ${id}`);
    }
    return entry;
  }

  /** Generate a brand-new wallet, persist it in the vault, and return it unlocked. */
  async createWallet(name: string, strength: MnemonicStrength = 128): Promise<{ id: string; wallet: Wallet }> {
    const wallet = Wallet.generate(strength);
    const id = globalThis.crypto.randomUUID();
    this.#wallets.push({ id, name, mnemonic: wallet.mnemonic, createdAt: Date.now() });
    await this.#persist();
    return { id, wallet };
  }

  /** Import an existing mnemonic as a new wallet, persist it in the vault, and return it unlocked. */
  async importWallet(name: string, mnemonic: string): Promise<{ id: string; wallet: Wallet }> {
    if (!validateMnemonic(mnemonic)) {
      throw new Error("Invalid mnemonic");
    }
    const wallet = new Wallet(mnemonic);
    const id = globalThis.crypto.randomUUID();
    this.#wallets.push({ id, name, mnemonic: wallet.mnemonic, createdAt: Date.now() });
    await this.#persist();
    return { id, wallet };
  }

  /** Get an unlocked `Wallet` for an existing entry. Throws if the id is unknown. */
  getWallet(id: string): Wallet {
    return new Wallet(this.#findEntry(id).mnemonic);
  }

  /** Rename a wallet entry. */
  async renameWallet(id: string, name: string): Promise<void> {
    this.#findEntry(id).name = name;
    await this.#persist();
  }

  /** Remove one wallet from the vault (does not affect on-chain funds). Throws if the id is unknown. */
  async removeWallet(id: string): Promise<void> {
    this.#findEntry(id); // throws if missing
    this.#wallets = this.#wallets.filter((wallet) => wallet.id !== id);
    await this.#persist();
  }

  /** Re-encrypt the vault under a new password. */
  async changePassword(newPassword: string): Promise<void> {
    this.#password = newPassword;
    await this.#persist();
  }
}
