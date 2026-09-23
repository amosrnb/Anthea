import { beforeEach, describe, expect, it } from "vitest";
import { createVault, deleteVault, keystoreExists, readVault, writeVault } from "../src/keystore.js";

describe("keystore vault", () => {
  beforeEach(async () => {
    await deleteVault();
  });

  it("reports no vault before one is created", async () => {
    expect(await keystoreExists()).toBe(false);
  });

  it("createVault persists an empty vault", async () => {
    await createVault("correct password");
    expect(await keystoreExists()).toBe(true);
    const contents = await readVault("correct password");
    expect(contents.wallets).toEqual([]);
  });

  it("rejects creating a second vault while one exists", async () => {
    await createVault("pw");
    await expect(createVault("pw2")).rejects.toThrow(/already exists/);
  });

  it("persists and reloads wallet entries through the encrypted vault", async () => {
    await createVault("correct password");
    const entry = {
      id: "wallet-1",
      name: "Main",
      mnemonic: "legal winner thank year wave sausage worth useful legal winner thank yellow",
      createdAt: Date.now(),
    };
    await writeVault({ version: 1, wallets: [entry] }, "correct password");
    const loaded = await readVault("correct password");
    expect(loaded.wallets).toEqual([entry]);
  });

  it("rejects loading with the wrong password", async () => {
    await createVault("right-password");
    await expect(readVault("wrong-password")).rejects.toThrow();
  });

  it("throws when no vault exists", async () => {
    await expect(readVault("any-password")).rejects.toThrow(/No wallet vault found/);
  });

  it("deleteVault removes the vault", async () => {
    await createVault("pw");
    await deleteVault();
    expect(await keystoreExists()).toBe(false);
  });
});
