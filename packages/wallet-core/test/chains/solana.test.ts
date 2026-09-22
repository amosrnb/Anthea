import { describe, expect, it } from "vitest";
import { deriveSolanaKeypair, SolanaAccount, solanaDerivationPath } from "../../src/chains/solana.js";
import { generateMnemonic } from "../../src/mnemonic.js";

describe("solana chain adapter", () => {
  it("uses the fully-hardened SLIP-0010 path m/44'/501'/{account}'/0'", () => {
    expect(solanaDerivationPath(0)).toBe("m/44'/501'/0'/0'");
    expect(solanaDerivationPath(3)).toBe("m/44'/501'/3'/0'");
  });

  it("derives a deterministic keypair from the same mnemonic + account index", () => {
    const mnemonic = generateMnemonic();
    const a = deriveSolanaKeypair(mnemonic, 0);
    const b = deriveSolanaKeypair(mnemonic, 0);
    expect(a.publicKey.toBase58()).toBe(b.publicKey.toBase58());
  });

  it("derives different addresses for different account indices from the same mnemonic", () => {
    const mnemonic = generateMnemonic();
    const first = deriveSolanaKeypair(mnemonic, 0);
    const second = deriveSolanaKeypair(mnemonic, 1);
    expect(first.publicKey.toBase58()).not.toBe(second.publicKey.toBase58());
  });

  it("derives a different address than the Ethereum account from the same mnemonic (different curve)", async () => {
    const { deriveEthereumAccount } = await import("../../src/chains/ethereum.js");
    const mnemonic = generateMnemonic();
    const ethereum = deriveEthereumAccount(mnemonic, 0);
    const solana = deriveSolanaKeypair(mnemonic, 0);
    expect(solana.publicKey.toBase58()).not.toBe(ethereum.address);
  });

  it("rejects deriving from an invalid mnemonic", () => {
    expect(() => deriveSolanaKeypair("invalid mnemonic", 0)).toThrow(/Invalid mnemonic/);
  });

  it("signMessage produces a base58 signature without exposing the private key", async () => {
    const account = new SolanaAccount(deriveSolanaKeypair(generateMnemonic(), 0));
    const signature = await account.signMessage("hello anthea");
    expect(signature).toMatch(/^[1-9A-HJ-NP-Za-km-z]+$/); // base58 alphabet
  });

  describe("input validation (fails closed before any network call)", () => {
    const account = new SolanaAccount(deriveSolanaKeypair(generateMnemonic(), 0));

    it("rejects a malformed recipient address for sends", async () => {
      await expect(account.sendNative("not-an-address", "1")).rejects.toThrow(/Invalid Solana address/);
    });

    it("rejects zero or negative send amounts", async () => {
      const to = account.address; // any well-formed address; amount check happens after address check
      await expect(account.sendNative(to, "0")).rejects.toThrow(/greater than zero/);
    });
  });
});
