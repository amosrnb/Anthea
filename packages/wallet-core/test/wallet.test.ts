import { describe, expect, it } from "vitest";
import { Wallet } from "../src/wallet.js";
import { generateMnemonic, validateMnemonic } from "../src/mnemonic.js";

describe("Wallet", () => {
  it("generate() produces a valid mnemonic", () => {
    const wallet = Wallet.generate();
    expect(validateMnemonic(wallet.mnemonic)).toBe(true);
  });

  it("rejects constructing a wallet from an invalid mnemonic", () => {
    expect(() => new Wallet("not a valid mnemonic")).toThrow(/Invalid mnemonic/);
  });

  it("derives both an Ethereum and a Solana account for the same account index", () => {
    const wallet = new Wallet(generateMnemonic());
    const account = wallet.account(0);
    expect(account.ethereum.address).toMatch(/^0x[0-9a-fA-F]{40}$/);
    expect(account.solana.address).toBeTruthy();
    expect(account.ethereum.address).not.toBe(account.solana.address);
  });

  it("caches derived accounts so repeated access returns the same instance", () => {
    const wallet = new Wallet(generateMnemonic());
    expect(wallet.account(0)).toBe(wallet.account(0));
  });

  it("derives a different account per index (multi-account)", () => {
    const wallet = new Wallet(generateMnemonic());
    const first = wallet.account(0);
    const second = wallet.account(1);
    expect(first.ethereum.address).not.toBe(second.ethereum.address);
    expect(first.solana.address).not.toBe(second.solana.address);
  });

  it("reproduces the same accounts when reconstructed from the same mnemonic", () => {
    const mnemonic = generateMnemonic();
    const a = new Wallet(mnemonic).account(0);
    const b = new Wallet(mnemonic).account(0);
    expect(a.ethereum.address).toBe(b.ethereum.address);
    expect(a.solana.address).toBe(b.solana.address);
  });

  it("chain() resolves the account for a given chain id", () => {
    const account = new Wallet(generateMnemonic()).account(0);
    expect(account.chain("ethereum")).toBe(account.ethereum);
    expect(account.chain("solana")).toBe(account.solana);
  });
});
