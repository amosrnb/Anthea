import { afterEach, describe, expect, it } from "vitest";
import { WalletManager } from "../src/wallet-manager.js";
import { setVaultStorage, getVaultStorage, type VaultStorage } from "../src/storage/storage.js";

/** In-memory string store, standing in for a platform secure store (e.g. iOS Keychain). */
function memoryStorage(): VaultStorage & { raw: Map<string, string> } {
  const raw = new Map<string, string>();
  return {
    raw,
    async get<T>(key: string) {
      const value = raw.get(key);
      return value === undefined ? undefined : (JSON.parse(value) as T);
    },
    async set<T>(key: string, value: T) {
      raw.set(key, JSON.stringify(value));
    },
    async delete(key: string) {
      raw.delete(key);
    },
  };
}

describe("pluggable vault storage", () => {
  const defaultStorage = getVaultStorage();
  afterEach(() => setVaultStorage(defaultStorage));

  it("persists the vault through a custom backend, encrypted", async () => {
    const storage = memoryStorage();
    setVaultStorage(storage);

    expect(await WalletManager.exists()).toBe(false);
    const manager = await WalletManager.initialize("correct password");
    const { wallet } = await manager.createWallet("Main");

    const stored = storage.raw.get("vault");
    expect(stored).toBeDefined();
    expect(stored).not.toContain(wallet.mnemonic.split(" ")[0] + " "); // never plaintext

    const reopened = await WalletManager.unlock("correct password");
    const [summary] = reopened.list();
    expect(reopened.getWallet(summary!.id).mnemonic).toBe(wallet.mnemonic);
    await expect(WalletManager.unlock("wrong password")).rejects.toThrow(/Incorrect password/);

    await WalletManager.removeAll();
    expect(storage.raw.size).toBe(0);
  });
});
