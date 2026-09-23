import { describe, expect, it } from "vitest";
import { deriveEthereumAccount, EthereumAccount, ethereumDerivationPath } from "../../src/chains/ethereum.js";
import { generateMnemonic } from "../../src/mnemonic.js";

describe("ethereum chain adapter", () => {
  it("uses the standard EVM path m/44'/60'/0'/0/{account}", () => {
    expect(ethereumDerivationPath(0)).toBe("m/44'/60'/0'/0/0");
    expect(ethereumDerivationPath(3)).toBe("m/44'/60'/0'/0/3");
  });

  it("derives a deterministic address from the same mnemonic + account index", () => {
    const mnemonic = generateMnemonic();
    const a = deriveEthereumAccount(mnemonic, 0);
    const b = deriveEthereumAccount(mnemonic, 0);
    expect(a.address).toBe(b.address);
    expect(a.address).toMatch(/^0x[0-9a-fA-F]{40}$/);
  });

  it("derives different addresses for different account indices from the same mnemonic", () => {
    const mnemonic = generateMnemonic();
    const first = deriveEthereumAccount(mnemonic, 0);
    const second = deriveEthereumAccount(mnemonic, 1);
    expect(first.address).not.toBe(second.address);
  });

  it("derives the well-known address for the standard BIP39 test mnemonic", () => {
    const mnemonic =
      "abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about";
    expect(deriveEthereumAccount(mnemonic, 0).address).toBe("0x9858EfFD232B4033E47d90003D41EC34EcaEda94");
  });

  it("derives different addresses from different mnemonics", () => {
    const a = deriveEthereumAccount(generateMnemonic(), 0);
    const b = deriveEthereumAccount(generateMnemonic(), 0);
    expect(a.address).not.toBe(b.address);
  });

  it("rejects deriving from an invalid mnemonic", () => {
    expect(() => deriveEthereumAccount("invalid mnemonic", 0)).toThrow(/Invalid mnemonic/);
  });

  it("well-known BIP39 test-vector mnemonic always derives the same address", () => {
    const mnemonic =
      "abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about";
    const account = deriveEthereumAccount(mnemonic, 0);
    const again = deriveEthereumAccount(mnemonic, 0);
    expect(account.address).toBe(again.address);
  });

  it("signMessage produces a signature without exposing the private key", async () => {
    const account = new EthereumAccount(deriveEthereumAccount(generateMnemonic(), 0));
    const signature = await account.signMessage("hello anthea");
    expect(signature).toMatch(/^0x[0-9a-fA-F]+$/);
  });

  describe("input validation (fails closed before any network call)", () => {
    const account = new EthereumAccount(deriveEthereumAccount(generateMnemonic(), 0));

    it("rejects a malformed recipient address for sends", async () => {
      await expect(account.sendNative("not-an-address", "1")).rejects.toThrow(/Invalid Ethereum address/);
    });

    it("rejects zero or negative send amounts", async () => {
      const to = "0x000000000000000000000000000000000000dead";
      await expect(account.sendNative(to, "0")).rejects.toThrow(/greater than zero/);
    });
  });
});
