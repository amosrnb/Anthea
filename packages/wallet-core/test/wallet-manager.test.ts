import { beforeEach, describe, expect, it } from "vitest";
import { WalletManager } from "../src/wallet-manager.js";
import { deleteVault } from "../src/keystore.js";
import { validateMnemonic } from "../src/mnemonic.js";

describe("WalletManager", () => {
  beforeEach(async () => {
    await deleteVault();
  });

  it("reports non-existence before any vault is created", async () => {
    expect(await WalletManager.exists()).toBe(false);
  });

  it("initialize creates an empty vault", async () => {
    const manager = await WalletManager.initialize("password123");
    expect(manager.list()).toEqual([]);
    expect(await WalletManager.exists()).toBe(true);
  });

  it("createWallet adds a wallet with a valid mnemonic and persists it", async () => {
    const manager = await WalletManager.initialize("password123");
    const { id, wallet } = await manager.createWallet("Main");
    expect(validateMnemonic(wallet.mnemonic)).toBe(true);
    expect(manager.list()).toEqual([{ id, name: "Main", createdAt: expect.any(Number) }]);
  });

  it("supports multiple independent wallets (separate mnemonics) in one vault", async () => {
    const manager = await WalletManager.initialize("password123");
    const { id: id1, wallet: wallet1 } = await manager.createWallet("Main");
    const { id: id2, wallet: wallet2 } = await manager.createWallet("Savings");
    expect(id1).not.toBe(id2);
    expect(wallet1.mnemonic).not.toBe(wallet2.mnemonic);
    expect(manager.list()).toHaveLength(2);
  });

  it("unlock after createWallet reproduces the same wallets", async () => {
    const created = await WalletManager.initialize("my-password");
    const { id } = await created.createWallet("Main");

    const unlocked = await WalletManager.unlock("my-password");
    expect(unlocked.list()).toHaveLength(1);
    expect(unlocked.getWallet(id).account(0).ethereum.address).toBe(
      created.getWallet(id).account(0).ethereum.address,
    );
  });

  it("unlock fails with the wrong password", async () => {
    await WalletManager.initialize("right-password");
    await expect(WalletManager.unlock("wrong-password")).rejects.toThrow();
  });

  it("importWallet derives the expected accounts and persists them", async () => {
    const manager = await WalletManager.initialize("pw");
    const mnemonic = "legal winner thank year wave sausage worth useful legal winner thank yellow";
    const { id, wallet } = await manager.importWallet("Imported", mnemonic);
    expect(wallet.mnemonic).toBe(mnemonic);

    const unlocked = await WalletManager.unlock("pw");
    expect(unlocked.getWallet(id).account(0).ethereum.address).toBe(wallet.account(0).ethereum.address);
  });

  it("importWallet rejects an invalid mnemonic", async () => {
    const manager = await WalletManager.initialize("pw");
    await expect(manager.importWallet("Bad", "not a valid mnemonic")).rejects.toThrow(/Invalid mnemonic/);
  });

  it("getWallet throws for an unknown id", async () => {
    const manager = await WalletManager.initialize("pw");
    expect(() => manager.getWallet("nonexistent")).toThrow(/Wallet not found/);
  });

  it("removeWallet deletes only the targeted wallet", async () => {
    const manager = await WalletManager.initialize("pw");
    const { id: id1 } = await manager.createWallet("Main");
    const { id: id2 } = await manager.createWallet("Savings");

    await manager.removeWallet(id1);
    expect(manager.list().map((w) => w.id)).toEqual([id2]);

    const reloaded = await WalletManager.unlock("pw");
    expect(reloaded.list().map((w) => w.id)).toEqual([id2]);
  });

  it("removeWallet throws for an unknown id", async () => {
    const manager = await WalletManager.initialize("pw");
    await expect(manager.removeWallet("nonexistent")).rejects.toThrow(/Wallet not found/);
  });

  it("renameWallet updates and persists the name", async () => {
    const manager = await WalletManager.initialize("pw");
    const { id } = await manager.createWallet("Main");
    await manager.renameWallet(id, "Renamed");
    expect(manager.list()[0]?.name).toBe("Renamed");

    const reloaded = await WalletManager.unlock("pw");
    expect(reloaded.list()[0]?.name).toBe("Renamed");
  });

  it("changePassword re-encrypts the vault under the new password", async () => {
    const manager = await WalletManager.initialize("old-password");
    await manager.createWallet("Main");
    await manager.changePassword("new-password");

    await expect(WalletManager.unlock("old-password")).rejects.toThrow();
    const reloaded = await WalletManager.unlock("new-password");
    expect(reloaded.list()).toHaveLength(1);
  });

  it("removeAll deletes the entire vault", async () => {
    const manager = await WalletManager.initialize("pw");
    await manager.createWallet("Main");
    await WalletManager.removeAll();
    expect(await WalletManager.exists()).toBe(false);
  });
});
