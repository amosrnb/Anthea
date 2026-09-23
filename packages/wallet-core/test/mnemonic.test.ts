import { describe, expect, it } from "vitest";
import { generateMnemonic, mnemonicToSeed, normalizeMnemonic, validateMnemonic } from "../src/mnemonic.js";

describe("mnemonic", () => {
  it("generates a valid 12-word mnemonic by default", () => {
    const mnemonic = generateMnemonic();
    expect(mnemonic.trim().split(/\s+/)).toHaveLength(12);
    expect(validateMnemonic(mnemonic)).toBe(true);
  });

  it("generates a valid 24-word mnemonic when requested", () => {
    const mnemonic = generateMnemonic(256);
    expect(mnemonic.trim().split(/\s+/)).toHaveLength(24);
    expect(validateMnemonic(mnemonic)).toBe(true);
  });

  it("generates different mnemonics on each call", () => {
    expect(generateMnemonic()).not.toBe(generateMnemonic());
  });

  it("rejects an invalid mnemonic", () => {
    expect(validateMnemonic("not a real mnemonic at all just words")).toBe(false);
  });

  it("normalizes case and whitespace before validating", () => {
    const mnemonic = "legal winner thank year wave sausage worth useful legal winner thank yellow";
    expect(validateMnemonic(`  ${mnemonic.toUpperCase()}  `)).toBe(true);
    expect(normalizeMnemonic(`  ${mnemonic.toUpperCase()}  `)).toBe(mnemonic);
  });

  it("derives a deterministic seed from the same mnemonic", () => {
    const mnemonic = generateMnemonic();
    expect(mnemonicToSeed(mnemonic)).toEqual(mnemonicToSeed(mnemonic));
  });

  it("derives different seeds from different mnemonics", () => {
    expect(mnemonicToSeed(generateMnemonic())).not.toEqual(mnemonicToSeed(generateMnemonic()));
  });

  it("throws when deriving a seed from an invalid mnemonic", () => {
    expect(() => mnemonicToSeed("invalid mnemonic")).toThrow(/Invalid mnemonic/);
  });
});
